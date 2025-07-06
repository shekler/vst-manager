// data/mock-plugins.ts
import type { VstPlugin } from "~/types/plugin";

export const mockPlugins: VstPlugin[] = [
	{
		id: "C:/plugins/serum.dll",
		name: "Serum",
		vendor: "Xfer Records",
		format: "VST2",
		bitness: "64-bit",
		path: "C:/plugins/serum.dll",
		tags: ["Synth", "Favorite"],
	},
	{
		id: "C:/plugins/vst3/pro-q-3.vst3",
		name: "Pro-Q 3",
		vendor: "FabFilter",
		format: "VST3",
		bitness: "64-bit",
		path: "C:/plugins/vst3/pro-q-3.vst3",
		tags: ["EQ", "Mastering"],
	},
	{
		id: "C:/plugins_32/old_synth.dll",
		name: "Old Synth (32-bit)",
		vendor: "Vintage Co",
		format: "VST2",
		bitness: "32-bit",
		path: "C:/plugins_32/old_synth.dll",
		tags: ["Synth"],
	},
	// ...add 10-15 more to have a good list to work with
];
