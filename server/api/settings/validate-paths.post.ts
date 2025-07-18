import { existsSync } from "fs";
import { join } from "path";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { paths } = body;

    if (!paths || !Array.isArray(paths)) {
      return {
        success: false,
        message: "Paths array is required",
      };
    }

    const validations = paths.map((path: string) => {
      try {
        const exists = existsSync(path);
        return {
          path,
          exists,
          error: exists ? null : "Path does not exist",
        };
      } catch (error: any) {
        return {
          path,
          exists: false,
          error: error.message || "Error checking path",
        };
      }
    });

    return {
      success: true,
      data: validations,
    };
  } catch (error: any) {
    console.error("Error validating paths:", error);
    return {
      success: false,
      message: error.message || "Failed to validate paths",
    };
  }
});
