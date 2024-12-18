import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import path from "node:path";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { fileTypeFromBuffer } from "file-type";

const b_in_mb = 1048576;

export const uploadPath = "/uploads";

export const multer_upload = multer({
	storage: multer.memoryStorage(),
	limits: { files: 20, fileSize: 50 * b_in_mb },
});

export function deleteUpload(path: string) {
	fs.unlinkSync(`${uploadPath}/${path}`);
}

export async function writeImage(prefix: string, buffer: Buffer): Promise<string> {
    const filetype = await fileTypeFromBuffer(buffer);
	const filename = generateFilename(prefix, filetype.ext);
	const filepath = path.join(uploadPath, filename);
	await sharp(buffer)
		.resize({ width: 1024 })
		.withMetadata()
		.toFile(filepath);
	return filename;
} 

export function upload(fields: multer.Field[]): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) => {
		const multer_middleware = multer_upload.fields(fields);
		multer_middleware(req, res, async () => {
			if (req.files) {
				for (const key of Object.keys(req.files)) {
					// resize and write the images of this field (e.g. "cover")
					// and add its filename to each file object
					for (let i = 0; i < req.files[key].length; i++) {
                        let file = req.files[key][i] as Express.Multer.File;
						const filename = await writeImage(file.fieldname, file.buffer);
						req.files[key][i].filename = filename;
					}
				}
			}
			next();
		});
	}
}

// private
// --------------------------------------------
function generateFilename(prefix: string, extension: string): string {
	const uniqueSuffix = generateUniqueName();
	const filename = `${prefix}-${uniqueSuffix}.${extension}`;
	return filename;
}

function generateUniqueName(): string {
	return Date.now() + '-' + Math.round(Math.random() * 1E9);
}
