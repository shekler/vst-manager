#include "VST3Host.h"

#include <iostream>
#include <filesystem>

#if _WIN32
#include <combaseapi.h>
#endif

// --- MinimalVST3Host Implementation ---
MinimalVST3Host::MinimalVST3Host() {
    name_ = "MinimalVST3ScannerHost";
}

tresult PLUGIN_API MinimalVST3Host::getName(Steinberg::Vst::String128 name) {
    Steinberg::Vst::StringConvert::convert (name_, name, 128);
    return Steinberg::kResultTrue;
}

tresult PLUGIN_API MinimalVST3Host::createInstance(TUID cid, TUID iid, void** obj) {
    *obj = nullptr;
    return Steinberg::kResultFalse;
}

// --- VST3Scanner Implementation ---
VST3Scanner::VST3Scanner() {
#if _WIN32
    CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
#endif
    hostApplication_ = std::make_unique<MinimalVST3Host>();
}

VST3Scanner::~VST3Scanner() {
#if _WIN32
    CoUninitialize();
#endif
}

std::vector<VST3PluginMetadata> VST3Scanner::scanDirectory(const std::string& directoryPath) {
    std::vector<VST3PluginMetadata> plugins;
    std::filesystem::path dir(directoryPath);

    if (!std::filesystem::exists(dir) || !std::filesystem::is_directory(dir)) {
        std::cerr << "Directory does not exist or is not a directory: " << directoryPath << std::endl;
        return plugins;
    }

    Steinberg::Vst::Module::initHostModule ();

    for (const auto& entry : std::filesystem::directory_iterator(dir)) {
        bool isVst3Bundle = entry.is_directory() && entry.path().extension().string() == ".vst3";
        bool isVst3File = entry.is_regular_file() && entry.path().extension().string() == ".vst3";

        if (isVst3Bundle || isVst3File) {
            std::string filePath = entry.path().string();
            Steinberg::Vst::PlugProvider plugProvider(entry.path().wstring().c_str(), hostApplication_.get());

            if (!plugProvider.isValid()) {
                // std::cerr << "Failed to load VST3 module: " << filePath << std::endl; // Uncomment for debug
                continue;
            }

            Steinberg::Vst::IPluginFactory* factory = plugProvider.getPluginFactory();
            if (factory) {
                for (int32 i = 0; i < factory->countClasses(); ++i) {
                    Steinberg::PClassInfo2 info;
                    if (factory->getClassInfo2(i, &info) == Steinberg::kResultTrue) {
                        if (std::string(info.category) == Steinberg::Vst::PlugProvider::kAudioModuleCategory) {
                            VST3PluginMetadata metadata;

                            metadata.name = Steinberg::Vst::StringConvert::convert (info.name);
                            metadata.vendor = Steinberg::Vst::StringConvert::convert (info.vendor);
                            metadata.version = Steinberg::Vst::StringConvert::convert (info.version);
                            metadata.id = Steinberg::TUIDtoString (info.cid);
                            metadata.filePath = filePath;

                            plugins.push_back(metadata);
                        }
                    }
                }
            }
        }
    }
    Steinberg::Vst::Module::exitHostModule();

    return plugins;
}