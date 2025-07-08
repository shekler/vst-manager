#include <napi.h>
#include "VST3Host.h"

Napi::Array ScanVstPlugins(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for directory path").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }

    std::string directoryPath = info[0].As<Napi::String>().Utf8Value();

    VST3Scanner scanner; // Use the VST3Scanner class
    std::vector<VST3PluginMetadata> scannedPlugins = scanner.scanDirectory(directoryPath);

    Napi::Array results = Napi::Array::New(env, scannedPlugins.size());
    for (size_t i = 0; i < scannedPlugins.size(); ++i) {
        Napi::Object pluginObj = Napi::Object::New(env);
        pluginObj.Set("name", Napi::String::New(env, scannedPlugins[i].name));
        pluginObj.Set("vendor", Napi::String::New(env, scannedPlugins[i].vendor));
        pluginObj.Set("version", Napi::String::New(env, scannedPlugins[i].version));
        pluginObj.Set("id", Napi::String::New(env, scannedPlugins[i].id)); // VST3 specific ID
        pluginObj.Set("filePath", Napi::String::New(env, scannedPlugins[i].filePath));

        results[i] = pluginObj;
    }

    return results;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "scanVstPlugins"),
                Napi::Function::New(env, ScanVstPlugins));
    return exports;
}

NODE_API_MODULE(vst_scanner_native, Init)