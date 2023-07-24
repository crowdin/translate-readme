import * as path from 'path';

const generateRelativeFileLink = (currentFilePath: string, destinationFilePath: string): string => {
    return path.relative(path.dirname(currentFilePath), destinationFilePath);
};

const baseName = (filePath: string): string => {
    return filePath.split('/').pop() || filePath;
};

const toPlatformPath = (pth: string): string => {
    return pth.replace(/[/\\]/g, path.sep);
};

export {generateRelativeFileLink, baseName, toPlatformPath};
