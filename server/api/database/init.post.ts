import { addSettingsTable } from "../database";

export default defineEventHandler(async (event) => {
  try {
    await addSettingsTable();
    return {
      success: true,
      message: "Settings table created successfully",
    };
  } catch (error) {
    console.error("Error creating settings table:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create settings table",
    });
  }
});
