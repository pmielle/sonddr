import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import path from "node:path";
import { Request, Response, NextFunction, RequestHandler } from "express";

const b_in_mb = 1048576;

export const uploadPath = "uploads";

export const multer_upload = multer({
	storage: multer.memoryStorage(),
	limits: { files: 20, fileSize: 50 * b_in_mb },
});

export function deleteUpload(path: string) {
	fs.unlinkSync(`${uploadPath}/${path}`);
}

export async function writeImage(file: Express.Multer.File): Promise<string> {
	const filename = generateFilename(file);
	const filepath = path.join(uploadPath, filename);
	await sharp(file.buffer)
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
						const filename = await writeImage(req.files[key][i]);
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
function generateFilename(file: Express.Multer.File): string {
	const extension = getImageExtension(file);
	const uniqueSuffix = generateUniqueName();
	const filename = `${file.fieldname}-${uniqueSuffix}.${extension}`;
	return filename;
}

function generateUniqueName(): string {
	return Date.now() + '-' + Math.round(Math.random() * 1E9);
}

function getImageExtension(file: Express.Multer.File): string {
	const [type, extension] = file.mimetype.split("/");
	if (type !== "image") { throw new Error(`${file.filename} is not an image; its mimetype is ${file.mimetype}`); };
	return extension;
}
