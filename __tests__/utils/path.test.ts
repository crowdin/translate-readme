import {generateRelativeFileLink, baseName, toPlatformPath} from '../../src/utils/path';
import {jest, expect, describe, it} from '@jest/globals';
import * as path from 'path';

jest.mock('axios');
jest.mock('fs');

describe('utils', () => {
    describe('generateRelativeFileLink', () => {
        it('should generate the relative file link between two file paths', () => {
            const currentFilePath = '/path/to/current/file.ts';
            const destinationFilePath = '/path/to/destination/file.ts';
            const expectedRelativeLink = '../destination/file.ts';

            const relativeLink = generateRelativeFileLink(currentFilePath, destinationFilePath);

            expect(relativeLink).toEqual(expectedRelativeLink);
        });
    });

    describe('baseName', () => {
        it('should return the base name of the file path', () => {
            const filePath = '/path/to/some/file.txt';
            const expectedBaseName = 'file.txt';

            const result = baseName(filePath);

            expect(result).toEqual(expectedBaseName);
        });

        it('should return the full path if the file path is just a basename', () => {
            const filePath = 'file.txt';

            const result = baseName(filePath);

            expect(result).toEqual(filePath);
        });

        it('should return an empty string for an empty path', () => {
            const filePath = '';

            const result = baseName(filePath);

            expect(result).toEqual('');
        });
    });
});

describe('toPlatformPath', () => {
    it('should replace forward slashes with platform-specific path separator', () => {
        const inputPath = 'path/to/file.txt';
        const expectedPlatformPath = 'path/to/file.txt';
        const result = toPlatformPath(inputPath);

        expect(result).toEqual(expectedPlatformPath);
    });

    it('should replace backslashes with platform-specific path separator', () => {
        const inputPath = 'path\\to\\file.txt';
        const expectedPlatformPath = 'path/to/file.txt';
        const result = toPlatformPath(inputPath);

        expect(result).toEqual(expectedPlatformPath);
    });

    it('should handle mixed forward slashes and backslashes correctly', () => {
        const inputPath = 'path/to\\file.txt';
        const expectedPlatformPath = 'path/to/file.txt';
        const result = toPlatformPath(inputPath);

        expect(result).toEqual(expectedPlatformPath);
    });

    it('should not modify the path if it already uses the platform-specific separator', () => {
        const inputPath = `path${path.sep}to${path.sep}file.txt`;
        const result = toPlatformPath(inputPath);

        expect(result).toEqual(inputPath);
    });
});
