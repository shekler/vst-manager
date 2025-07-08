{
    "targets": [
        {
            "target_name": "vst_scanner_native",
            "sources": ["src/vst_scanner.cc", "src/VST3Host.cc"],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")",
                "<(module_root_dir)/vst3sdk",
            ],
            "defines": [
                "NAPI_CPP_EXCEPTIONS",
                "SMTG_NO_UID_REGISTRATION",
                "VstUnicode",
                "_UNICODE",
                "UNICODE",
                "_DEBUG",
                "DEBUG",
            ],
            "cflags_cc!": ["-fno-exceptions"],
            "cflags_cc": ["-std=c++17"],
            "libraries": [],
            "conditions": [
                [
                    'OS=="win"',
                    {
                        "defines": ["_CRT_SECURE_NO_WARNINGS"],
                        "msvs_settings": {
                            "VCCLCompilerTool": {
                                "ExceptionHandling": "2",
                                "RuntimeLibrary": "2",
                            }
                        },
                        "link_settings": {"libraries": ["-lole32", "-luuid"]},
                    },
                ],
                [
                    'OS=="mac"',
                    {
                        "xcode_settings": {
                            "OTHER_LDFLAGS": [
                                "-Wl,-rpath,@loader_path",
                                "-undefined dynamic_lookup",
                            ],
                            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
                            "MACOSX_DEPLOYMENT_TARGET": "10.13",
                        },
                        "link_settings": {
                            "libraries": [
                                "-L/usr/lib",
                                "-lc++",
                                "-ldl",
                                "-framework CoreFoundation",
                            ]
                        },
                    },
                ],
                ['OS=="linux"', {"link_settings": {"libraries": ["-ldl", "-luuid"]}}],
            ],
        }
    ]
}
