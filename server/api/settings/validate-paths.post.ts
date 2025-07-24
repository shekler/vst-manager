import { access } from "node:fs/promises";
import { constants } from "node:fs";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { paths } = body;

    if (!paths || !Array.isArray(paths)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Paths array is required",
      });
    }

    const validations = await Promise.all(
      paths.map(async (path: string) => {
        try {
          await access(path.trim(), constants.R_OK);
          return { path, exists: true };
        } catch (error) {
          return { path, exists: false, error: "Directory does not exist or is not accessible" };
        }
      }),
    );

    return {
      success: true,
      data: validations,
    };
  } catch (error) {
    console.error("Error validating paths:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to validate paths",
    });
  }
});
