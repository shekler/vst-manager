import { defineEventHandler } from "h3";
import { db } from "../../utils/db"; // Your Prisma client import

export default defineEventHandler(async () => {
	try {
		const plugins = await db.plugin.findMany({
			orderBy: { name: "asc" }, // Order by name for better display
		});
		return { success: true, plugins };
	} catch (error) {
		console.error("Failed to retrieve plugins from DB:", error);
		return { success: false, message: "Failed to retrieve plugins." };
	}
});
