
import "client/patches/index";
import { Migration } from "client/patches/migration";

const DEFAULT_CONTENT = JSON.stringify(Migration.$getSample());

//=================================================================
/**
 * Mock implementation of {@link FileSystemFileHandle} for testing purposes.
 * This provides a minimal implementation that can be stored in IndexedDB
 * and used in Playwright tests.
 */
//=================================================================
export class MockFileSystemFileHandle implements FileSystemFileHandle {
	public readonly kind: "file" = "file" as const;

	constructor(
		public readonly name: string,
		private readonly content: string = DEFAULT_CONTENT
	) { }

	getFile(): Promise<File> {
		return Promise.resolve(new File([this.content], this.name, {
			type: "application/json",
			lastModified: Date.now(),
		}));
	}

	isSameEntry(other: FileSystemHandle | MockFileSystemFileHandle): Promise<boolean> {
		// Simple reference equality check
		return Promise.resolve(this === other);
	}

	queryPermission(_descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
		return Promise.resolve("granted");
	}

	requestPermission(_descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
		return Promise.resolve("granted");
	}

	createWritable(_options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream> {
		// Mock implementation - not used in our tests
		throw new Error("createWritable not implemented in mock");
	}

	readonly isFile = true;

	readonly isDirectory = false;
}
