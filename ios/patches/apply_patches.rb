require 'cocoapods'


module Pod
    class Patch
        def find_patches
            return Dir["ios/patches/*.diff"]
        end
        
        # Returns true if the patch's added lines are already present in the
        # target file. `git apply --check` can report a patch as appliable even
        # when it has already been applied, because an inserted hunk may re-match
        # its own trailing context at a new offset (the Alamofire diff inserts a
        # block that itself ends in `downloadRequest.updateDownloadProgress(...)`,
        # which re-matches the hunk context). Applying a second time duplicates
        # the inserted lines — e.g. a second `let allHeaders` — which Swift 6 /
        # Xcode 26 reject as a hard "invalid redeclaration" error.
        #
        # This is a content-based idempotency guard. It only consults the FIRST
        # target file in the diff (every patch here touches a single file) and is
        # wrapped so any parsing failure falls through to the normal apply path —
        # it can only ADD a skip, never block a legitimate first application.
        #
        # The signature is the largest CONTIGUOUS block of added lines (in order,
        # with original indentation preserved), not a single line: a lone line
        # could coincidentally already exist elsewhere in the file and cause a
        # false skip on a genuine first apply. An ordered multi-line block is a
        # far stronger "already applied" signal.
        def patch_additions_present?(file, repo_root, directory_arg)
            diff = File.read(file)
            target_rel = diff[/^\+\+\+\sb\/(.+?)\s*$/, 1]
            return false unless target_rel

            # `-p2` strips the 2 leading path components (e.g. "b/Pods/"); the
            # remainder is resolved relative to --directory (the Pods dir).
            stripped = target_rel.split('/')[2..]&.join('/')
            return false if stripped.nil? || stripped.empty?

            target = File.join(repo_root, directory_arg, stripped)
            return false unless File.exist?(target)

            # Group added (`+`) lines into contiguous runs, preserving each line's
            # original indentation (only the leading '+' marker is removed). A run
            # is broken by any context/removed/hunk line.
            runs = []
            current = []
            diff.each_line do |line|
                chomped = line.chomp
                if chomped.start_with?('+') && !chomped.start_with?('+++')
                    current << chomped[1..].to_s
                else
                    runs << current unless current.empty?
                    current = []
                end
            end
            runs << current unless current.empty?
            return false if runs.empty?

            # Largest contiguous block (most lines) = strongest ordered anchor.
            signature = runs.max_by(&:length).join("\n")
            return false if signature.strip.empty?

            File.read(target).include?(signature)
        rescue StandardError => e
            Pod::UI.warn "Idempotency check skipped for #{file}: #{e}"
            false
        end

        def apply_patch(file)
            repo_root = `git rev-parse --show-toplevel`.strip
            pods_dir = Dir.glob(Pathname(repo_root).join("**/**/Pods")).first
            unless pods_dir
                Pod::UI.puts "Skipping #{file} (Pods directory not found yet)"
                return
            end
            directory_arg = pods_dir.sub("#{repo_root}/", "")

            Dir.chdir(repo_root) {
                base_args = "'#{file}' --directory='#{directory_arg}' -p2 2> /dev/null"

                already_applied = system("git apply --check --reverse #{base_args}")
                if already_applied
                    Pod::UI.puts "Skipping #{file} (already applied)"
                    next
                end

                can_apply = system("git apply --check #{base_args}")
                if can_apply
                    # Guard against re-applying a patch whose additions are already
                    # present (git can still report it appliable — see comment on
                    # patch_additions_present?). Prevents duplicate declarations
                    # that break the Swift 6 / Xcode 26 build.
                    if patch_additions_present?(file, repo_root, directory_arg)
                        Pod::UI.puts "Skipping #{file} (additions already present)"
                        next
                    end

                    did_apply = system("git apply #{base_args}")
                    if did_apply
                        Pod::UI.puts "Successfully applied #{file}"
                    else
                        Pod::UI.warn "Error: failed to apply #{file}"
                    end
                else
                    Pod::UI.warn "Warning: #{file} cannot be applied and does not appear to be already applied"
                end
            }
        end

        def apply
            files = find_patches()
            files.each do |f|
                apply_patch("#{Dir.pwd}/#{f}")
            end
        end
    end
end

p = Pod::Patch.new
p.apply
