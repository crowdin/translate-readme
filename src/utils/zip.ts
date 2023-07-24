import * as fs from 'fs';
import AdmZip from 'adm-zip';
import axios from 'axios';
import {toPlatformPath} from './path';

const downloadZipAndUnzip = async (zipUrl: string, destination: string): Promise<string[]> => {
    const response = await axios.get(zipUrl, {responseType: 'arraybuffer'});
    const zipFilePath = toPlatformPath(`Translations-${Date.now()}.zip`);

    fs.writeFileSync(zipFilePath, response.data);

    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(toPlatformPath(destination), true);

    const entries: string[] = zip.getEntries().map(entry => entry.entryName);

    fs.unlinkSync(zipFilePath);

    return entries;
};

export {downloadZipAndUnzip};
