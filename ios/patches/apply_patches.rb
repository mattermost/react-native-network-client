require 'cocoapods'


module Pod
    class Patch
        def find_patches
            return Dir["ios/patches/*.diff"]
        end
        
        def apply_patch(file)
            repo_root = `git rev-parse --show-toplevel`.strip
            directory_arg = Dir.glob(Pathname(repo_root).join("**/**/Pods")).first.sub("#{repo_root}/", "")
            puts "HEY #{file}"
        
            Dir.chdir(repo_root) {
                check_cmd = "git apply --check '#{file}' --directory='#{directory_arg}' -p2 2> /dev/null"
                can_apply = system(check_cmd)
                if can_apply
                    apply_cmd = check_cmd.gsub('--check ', '')
                    did_apply = system(apply_cmd)
                    if did_apply
                        Pod::UI.puts "Successfully applied #{file} 🎉"
                    else
                        Pod::UI.warn "Error: failed to apply #{file}"
                    end
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
