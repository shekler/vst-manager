#pragma once

#include <string>
#include <vector>
#include <memory>
#include <filesystem>
#include <map>

// VST3 SDK Headers
// These paths are relative to the vst3sdk root directory set in `binding.gyp`.

#include <pluginterfaces/base/fplatform.h>
#include <pluginterfaces/base/ftypes.h>
#include <pluginterfaces/base/funknown.h>
#include <pluginterfaces/base/funknownimpl.h>
#include <pluginterfaces/vst/ivsthostapplication.h>
#include <public.sdk/source/main/pluginfactory.h>
#include <public.sdk/source/main/moduleinit.h>
#include <public.sdk/source/vst/hosting/hostclasses.h>
#include <public.sdk/source/vst/hosting/module.h>
#include <public.sdk/source/vst/hosting/plugprovider.h>
#include <public.sdk/source/vst/utility/stringconvert.h>


// Minimal structure to hold VST3 plugin metadata
struct VST3PluginMetadata {
    std::string name;
    std::string id;
    std::string vendor;
    std::string version;
    std::string filePath;
};

// Minimal VST3 host context.
class MinimalVST3Host : public Steinberg::Vst::IHostApplication {
public:
    MinimalVST3Host();
    Steinberg::tresult PLUGIN_API getName(Steinberg::Vst::String128 name) override;
    Steinberg::tresult PLUGIN_API createInstance(Steinberg::TUID cid, Steinberg::TUID _iid, void** obj) override;
    DECLARE_FUNKNOWN_METHODS
private:
    std::string name_;
};

// Main VST3 scanning class
class VST3Scanner {
public:
    VST3Scanner();
    ~VST3Scanner();
    std::vector<VST3PluginMetadata> scanDirectory(const std::string& directoryPath);
private:
    std::unique_ptr<MinimalVST3Host> hostApplication_;
};