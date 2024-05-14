import Foundation

extension URL {
    func fileSize() throws -> Int {
        return try self.resourceValues(forKeys: [.fileSizeKey]).fileSize!
    }
}
