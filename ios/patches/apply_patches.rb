require 'cocoapods'


module Pod
    class Patch
        def find_patches
            return Dir["ios/patches/*.diff"]
        end
        
        def apply_patch(file)
            repo_root = `git rev-parse --show-toplevel`.strip
            directory_arg = Dir.glob(Pathname(repo_root).join("**/**/Pods")).first.sub("#{repo_root}/", "")

            Dir.chdir(repo_root) {
                base_args = "'#{file}' --directory='#{directory_arg}' -p2 2> /dev/null"

                already_applied = system("git apply --check --reverse #{base_args}")
                if already_applied
                    Pod::UI.puts "Skipping #{file} (already applied)"
                    next
                end

                can_apply = system("git apply --check #{base_args}")
                if can_apply
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
