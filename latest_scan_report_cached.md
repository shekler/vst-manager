# VST Manager scan report

- **Report id:** `1792265528`
- **Duration:** 6.8s
- **Roots scanned:**
  - `C:\Program Files\Common Files\VST3`
  - `C:\Program Files\VSTPlugins`
  - `C:\Program Files (x86)\Common Files\VST3`
  - `H:\VSTPlugins`

## Summary

| Metric | Count |
|--------|------:|
| Total plugins | 376 |
| Valid | 261 |
| From cache (this run) | 388 |
| Shards scanned | 2 |
| Missing license | 84 |
| Vendor skip | 13 |
| Timed out | 15 |
| Load failed | 3 |
| Warnings (events) | 0 |
| Errors (events) | 2 |
| Sum of per-plugin scan time (this run) | 6.5s |

_Newly detail-scanned this run: license skip 0, vendor skip 0, timeout 0, fail 2._
_Per-plugin **Time**: measured on last scan of that module; `(cache)` = served from cache this run._

## Slowest plugins (this run)

| Time | Outcome | Path | Name |
|------|---------|------|------|
| 3.30s | load_failed | `C:\Program Files (x86)\Common Files\VST3\WaveShell3-VST3 10.0.vst3` | — |
| 3.24s | load_failed | `C:\Program Files (x86)\Common Files\VST3\WaveShell1-VST3 10.0.vst3` | — |

## Plugins

| Outcome | Time | Path | Name | Vendor | Detail |
|---------|------|------|------|--------|--------|
| load_failed | 3.24s | `C:\Program Files (x86)\Common Files\VST3\WaveShell1-VST3 10.0.vst3` | — | — | LoadLibraryW failed with error number: 193 for path C:\Program Files (x86)\Common Files\VST3\WaveShell1-VST3 10.0.vst3 |
| load_failed | 3.30s | `C:\Program Files (x86)\Common Files\VST3\WaveShell3-VST3 10.0.vst3` | — | — | LoadLibraryW failed with error number: 193 for path C:\Program Files (x86)\Common Files\VST3\WaveShell3-VST3 10.0.vst3 |
| valid | 12.2s (cache) | `C:\Program Files\Common Files\VST3\Apogee Clearmountain 8068.vst3` | Apogee Clearmountain 8068 | Plugin Alliance | cid=ABCDEF019182FAEB41706F6741636C38; format=vst3 |
| valid | 24.5s (cache) | `C:\Program Files\Common Files\VST3\Apogee Clearmountain Dance.vst3` | Apogee Clearmountain Dance | Plugin Alliance | cid=ABCDEF019182FAEB41706F67434D4443; format=vst3 |
| valid | 21.2s (cache) | `C:\Program Files\Common Files\VST3\Apogee Clearmountain Domain.vst3` | Apogee Clearmountain Domain | Plugin Alliance | cid=ABCDEF019182FAEB41706F67434D444D; format=vst3 |
| valid | 15.6s (cache) | `C:\Program Files\Common Files\VST3\Apogee Clearmountain Phases.vst3` | Apogee Clearmountain Phases | Plugin Alliance | cid=ABCDEF019182FAEB41706F67434D5048; format=vst3 |
| valid | 6.27s (cache) | `C:\Program Files\Common Files\VST3\Apogee Clearmountain Spaces.vst3` | Apogee Clearmountain Spaces | Plugin Alliance | cid=ABCDEF019182FAEB41706F67434D5350; format=vst3 |
| valid | 9.76s (cache) | `C:\Program Files\Common Files\VST3\Apogee ECS2 Channel Strip.vst3` | Apogee ECS2 Channel Strip | Plugin Alliance | cid=ABCDEF019182FAEB41706F6745435332; format=vst3 |
| valid | 5.93s (cache) | `C:\Program Files\Common Files\VST3\Apogee EQP-1A.vst3` | Apogee EQP-1A | Plugin Alliance | cid=ABCDEF019182FAEB41706F6741657170; format=vst3 |
| valid | 5.74s (cache) | `C:\Program Files\Common Files\VST3\Apogee MEQ-5.vst3` | Apogee MEQ-5 | Plugin Alliance | cid=ABCDEF019182FAEB41706F67416D6571; format=vst3 |
| valid | 5.66s (cache) | `C:\Program Files\Common Files\VST3\Apogee Opto-3A.vst3` | Apogee Opto-3A | Plugin Alliance | cid=ABCDEF019182FAEB41706F67416F7074; format=vst3 |
| valid | 5.74s (cache) | `C:\Program Files\Common Files\VST3\Apogee Soft Limit.vst3` | Apogee Soft Limit | Plugin Alliance | cid=ABCDEF019182FAEB41706F67534C4D54; format=vst3 |
| valid | 5.49s (cache) | `C:\Program Files\Common Files\VST3\AudioCipherTechnologies\AudioCipher.vst3` | AudioCipher MIDI Vault V4 | AudioCipher Technologies | cid=ABCDEF019182FAEB42656C6C4265316C; format=vst3 |
| missing_license | 4.05s (cache) | `C:\Program Files\Common Files\VST3\Autoformer.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 46ms (cache) | `C:\Program Files\Common Files\VST3\Box Of Bass.vst3` | Box Of Bass | Box of Rules | cid=ABCDEF019182FAEB4278526C426F4266; format=vst3 |
| valid | 3.54s (cache) | `C:\Program Files\Common Files\VST3\Boz Digital Labs\Bark of Dog 3.vst3` | Bark of Dog 3 | Boz Digital Labs | cid=ABCDEF019182FAEB42444C61426F6433; format=vst3 |
| valid | 3.54s (cache) | `C:\Program Files\Common Files\VST3\Boz Digital Labs\Big Beautiful Door 2.vst3` | Big Beautiful Door 2 | Boz Digital Labs | cid=ABCDEF019182FAEB42444C6142626432; format=vst3 |
| valid | 106ms (cache) | `C:\Program Files\Common Files\VST3\Canvas Audio - Double Dare.vst3` | Double Dare | Canvas Audio | cid=ABCDEF019182FAEB436E764F44756245; format=vst3 |
| missing_license | 4.11s (cache) | `C:\Program Files\Common Files\VST3\CyberdriveCore.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 46ms (cache) | `C:\Program Files\Common Files\VST3\DF-COMP 2.vst3` | DF-COMP 2 | Drumforge | cid=56535444636D7464662D636F6D702032; format=vst3 |
| missing_license | 3.93s (cache) | `C:\Program Files\Common Files\VST3\DIFIX.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 46ms (cache) | `C:\Program Files\Common Files\VST3\Drum Spice.vst3` | Drum Spice | CELEST DSP x Audio Spices | cid=ABCDEF019182FAEB434C535444737063; format=vst3 |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\Drumforge\Kickforge.vst3` | Kickforge | Drumforge | cid=5653544B464D446B69636B666F726765; format=vst3 |
| valid | 46ms (cache) | `C:\Program Files\Common Files\VST3\DualClip.vst3` | DualClip | Plugin Boutique | cid=ABCDEF019182FAEB7069625444754331; format=vst3 |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\ECHO LAYER.vst3` | ECHO LAYER | Riverflux Audio | cid=ABCDEF019182FAEB5276667845634C31; format=vst3 |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\ELEGANTE.vst3` | ELEGANTE | fedDSP | cid=ABCDEF019182FAEB46445350454C4532; format=vst3 |
| valid | 46ms (cache) | `C:\Program Files\Common Files\VST3\ENHANCER VINTAGE-73.vst3` | ENHANCER VINTAGE-73 | noshigeSound | cid=ABCDEF019182FAEB4E73686753326576; format=vst3 |
| missing_license | 4.09s (cache) | `C:\Program Files\Common Files\VST3\ElectrumCore.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 12.6s (cache) | `C:\Program Files\Common Files\VST3\FIN-RETRO.vst3` | FIN-RETRO | UJAM | cid=ABCDEF019182FAEB554A414D46495245; format=vst3 |
| missing_license | 954ms (cache) | `C:\Program Files\Common Files\VST3\Finality Advanced.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 981ms (cache) | `C:\Program Files\Common Files\VST3\Finality Lite.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.80s (cache) | `C:\Program Files\Common Files\VST3\FireCharger.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.08s (cache) | `C:\Program Files\Common Files\VST3\FireEQ.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 2.60s (cache) | `C:\Program Files\Common Files\VST3\FireMaximizer.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 2.73s (cache) | `C:\Program Files\Common Files\VST3\FirePreamp.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 5.80s (cache) | `C:\Program Files\Common Files\VST3\FirePresser.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 8.56s (cache) | `C:\Program Files\Common Files\VST3\FireSnareVerb.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 2.62s (cache) | `C:\Program Files\Common Files\VST3\Gain Reduction Deluxe.vst3` | Gain Reduction Deluxe | Joey Sturgis Tones | cid=565354476E52646761696E2072656475; format=vst3 |
| valid | 247ms (cache) | `C:\Program Files\Common Files\VST3\Gemini Twin.vst3` | Gemini Twin | Joey Sturgis Tones | cid=56535447656D6967656D696E69207477; format=vst3 |
| valid | 14.6s (cache) | `C:\Program Files\Common Files\VST3\HUM Audio Devices LAAL.vst3` | HUM Audio Devices LAAL | Plugin Alliance | cid=5653544C41414C68756D20617564696F; format=vst3 |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\Harrison\Harrison Tape Saturator.vst3` | Harrison Tape Saturator | Harrison Audio | cid=565354486174736861727269736F6E20; format=vst3 |
| missing_license | 1.17s (cache) | `C:\Program Files\Common Files\VST3\Harrison\Harrison_3DDelay\Harrison_3DDelay.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 1.15s (cache) | `C:\Program Files\Common Files\VST3\Harrison\Harrison_DynoMite\Harrison_DynoMite.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.94s (cache) | `C:\Program Files\Common Files\VST3\Heater.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 12.5s (cache) | `C:\Program Files\Common Files\VST3\Hertz Instruments\Hertz Drums\HertzDrums.vst3` | Hertz Drums | Hertz Instruments | cid=ABCDEF019182FAEB4D616E7541777274; format=vst3 |
| valid | 2.82s (cache) | `C:\Program Files\Common Files\VST3\Howard Benson Vocal Multiplier.vst3` | Howard Benson Vocal Multiplier | Joey Sturgis Tones | cid=5653544862766D686F77617264206265; format=vst3 |
| missing_license | 8.42s (cache) | `C:\Program Files\Common Files\VST3\Ignition.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 179ms (cache) | `C:\Program Files\Common Files\VST3\JST Clip.vst3` | JST Clip | Joey Sturgis Tones | cid=5653544A636C506A737420636C697000; format=vst3 |
| valid | 1.40s (cache) | `C:\Program Files\Common Files\VST3\JST EQ.vst3` | JST EQ | Joey Sturgis Tones | cid=5653544A7365716A7374206571000000; format=vst3 |
| valid | 2.50s (cache) | `C:\Program Files\Common Files\VST3\JST Maximizer.vst3` | JST Maximizer | Joey Sturgis Tones | cid=5653544A6D61786A7374206D6178696D; format=vst3 |
| valid | 249ms (cache) | `C:\Program Files\Common Files\VST3\JVAL Audio - Stereoize.vst3` | Stereoize | JVAL Audio | cid=ABCDEF019182FAEB4A616C4F53746545; format=vst3 |
| valid | 1.14s (cache) | `C:\Program Files\Common Files\VST3\Kilohearts\kHs Bitcrush.vst3` | kHs Bitcrush | Kilohearts | cid=71FE697D00C0486F00492E140051E999; format=vst3 |
| valid | 1.26s (cache) | `C:\Program Files\Common Files\VST3\Kilohearts\kHs Tape Stop.vst3` | kHs Tape Stop | Kilohearts | cid=3625D13E0062499B0008041B00A15772; format=vst3 |
| valid | 20.2s (cache) | `C:\Program Files\Common Files\VST3\Kontakt 7.vst3` | Kontakt 7 | Native Instruments | cid=5653544E694B376B6F6E74616B742037; format=vst3 |
| valid | 66ms (cache) | `C:\Program Files\Common Files\VST3\Little Lush Halls.vst3` | Little Lush Halls | NOS Audio | cid=ABCDEF019182FAEB4E4F53414C78726C; format=vst3 |
| valid | 69ms (cache) | `C:\Program Files\Common Files\VST3\MORSO.vst3` | MORSO | fedDSP | cid=ABCDEF019182FAEB464453504D4F5253; format=vst3 |
| missing_license | 70ms (cache) | `C:\Program Files\Common Files\VST3\MeldaProduction\MSoundFactory.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 87ms (cache) | `C:\Program Files\Common Files\VST3\MeldaProduction\MSoundFactory6out.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 75ms (cache) | `C:\Program Files\Common Files\VST3\MeldaProduction\MTrackAlign.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 2.79s (cache) | `C:\Program Files\Common Files\VST3\Metal Bass Suite.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 46ms (cache) | `C:\Program Files\Common Files\VST3\Meter Core.vst3` | Meter Core | AutoFactory Audio | cid=ABCDEF019182FAEB414661754D744331; format=vst3 |
| valid | 13.9s (cache) | `C:\Program Files\Common Files\VST3\Modern Core Drum Kit.vst3` | Modern Core Drum Kit | Polarity Audio | cid=ABCDEF019182FAEB5061696450616D63; format=vst3 |
| load_failed | 324ms (cache) | `C:\Program Files\Common Files\VST3\Nada Indonesia\Edisi Gamelan Jawa.vst3` | — | — | LoadLibraryW failed for path C:\Program Files\Common Files\VST3\Nada Indonesia\Edisi Gamelan Jawa.vst3\Contents\x86_64-win\Edisi Gamelan Jawa.vst3: The specified module could not be found.  |
| missing_license | 4.39s (cache) | `C:\Program Files\Common Files\VST3\NanoBeast.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 107ms (cache) | `C:\Program Files\Common Files\VST3\No Work On Monday - Sssh.vst3` | Sssh | No Work On Monday | cid=ABCDEF019182FAEB4E726B5953737348; format=vst3 |
| missing_license | 7.08s (cache) | `C:\Program Files\Common Files\VST3\NoiseWorks\PloseAssist.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.45s (cache) | `C:\Program Files\Common Files\VST3\Orbitron.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.38s (cache) | `C:\Program Files\Common Files\VST3\OrbitronCore.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 107ms (cache) | `C:\Program Files\Common Files\VST3\Pat George - CINEFELT.vst3` | CINEFELT | Pat George | cid=ABCDEF019182FAEB5074674543696E54; format=vst3 |
| valid | 66ms (cache) | `C:\Program Files\Common Files\VST3\PeakLimit.vst3` | PeakLimit | Plugin Boutique | cid=ABCDEF019182FAEB706962545033614C; format=vst3 |
| valid | 13.1s (cache) | `C:\Program Files\Common Files\VST3\Pocket Strings.vst3` | Pocket Strings | Crow Hill | cid=ABCDEF019182FAEB5443484344443032; format=vst3 |
| missing_license | 3.26s (cache) | `C:\Program Files\Common Files\VST3\Presser.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 1.42s (cache) | `C:\Program Files\Common Files\VST3\Pulsar\Pulsar Smasher.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 48ms (cache) | `C:\Program Files\Common Files\VST3\RAIJU.vst3` | RAIJU | fedDSP | cid=ABCDEF019182FAEB464453505241494A; format=vst3 |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\RF-16VU.vst3` | RF-16VU | Riverflux Audio | cid=ABCDEF019182FAEB5276667841313630; format=vst3 |
| valid | 46ms (cache) | `C:\Program Files\Common Files\VST3\RF-1B.vst3` | RF-1B | Riverflux Audio | cid=ABCDEF019182FAEB5276667852663162; format=vst3 |
| valid | 322ms (cache) | `C:\Program Files\Common Files\VST3\RF-2A.vst3` | RF-2A | Riverflux Audio | cid=ABCDEF019182FAEB5276667852663261; format=vst3 |
| valid | 1.00s (cache) | `C:\Program Files\Common Files\VST3\RF-55A.vst3` | RF-55A | Riverflux Audio | cid=ABCDEF019182FAEB5276667841353561; format=vst3 |
| valid | 1.97s (cache) | `C:\Program Files\Common Files\VST3\RF-56.vst3` | RF-56 | Riverflux Audio | cid=ABCDEF019182FAEB5276667841353661; format=vst3 |
| valid | 1.61s (cache) | `C:\Program Files\Common Files\VST3\RF-67.vst3` | RF-67 | Riverflux Audio | cid=ABCDEF019182FAEB5276667852663637; format=vst3 |
| timed_out | 7.10s (cache) | `C:\Program Files\Common Files\VST3\RF-73.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 495ms (cache) | `C:\Program Files\Common Files\VST3\RF-76.vst3` | RF-76 | Riverflux Audio | cid=ABCDEF019182FAEB5276667846373665; format=vst3 |
| valid | 248ms (cache) | `C:\Program Files\Common Files\VST3\RF-A80.vst3` | RF-A80 | Riverflux Audio | cid=ABCDEF019182FAEB5276667841613830; format=vst3 |
| valid | 394ms (cache) | `C:\Program Files\Common Files\VST3\RF-AT12.vst3` | RF-AT12 | Riverflux Audio | cid=ABCDEF019182FAEB5276667841743132; format=vst3 |
| valid | 364ms (cache) | `C:\Program Files\Common Files\VST3\RF-E.vst3` | RF-E | Riverflux Audio | cid=ABCDEF019182FAEB5276667852666531; format=vst3 |
| valid | 266ms (cache) | `C:\Program Files\Common Files\VST3\RF-EQ1-A.vst3` | RF-EQ1-A | Riverflux Audio | cid=ABCDEF019182FAEB5276667845713161; format=vst3 |
| valid | 330ms (cache) | `C:\Program Files\Common Files\VST3\RF-MQ-5.vst3` | RF-MQ-5 | Riverflux Audio | cid=ABCDEF019182FAEB527666784D713561; format=vst3 |
| missing_license | 9.77s (cache) | `C:\Program Files\Common Files\VST3\Randomachine.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 263ms (cache) | `C:\Program Files\Common Files\VST3\Reason Rack Plugin.vst3` | Reason Rack Plugin | Reason Studios | cid=D75F65D1581F203A8D793B3C01583323; format=vst3 |
| valid | 191ms (cache) | `C:\Program Files\Common Files\VST3\SHI.vst3` | SHI | fedDSP | cid=ABCDEF019182FAEB464453504B534849; format=vst3 |
| valid | 202ms (cache) | `C:\Program Files\Common Files\VST3\SNAPPER.vst3` | SNAPPER | fedDSP | cid=ABCDEF019182FAEB46445350534E4150; format=vst3 |
| valid | 13.6s (cache) | `C:\Program Files\Common Files\VST3\SPL Attacker Plus.vst3` | SPL Attacker Plus | Plugin Alliance | cid=5653545350415073706C206174746163; format=vst3 |
| valid | 10.8s (cache) | `C:\Program Files\Common Files\VST3\SPL De-Verb Plus.vst3` | SPL De-Verb Plus | Plugin Alliance | cid=5653545350445073706C2064652D7665; format=vst3 |
| valid | 10.1s (cache) | `C:\Program Files\Common Files\VST3\SPL Mo-Verb Plus.vst3` | SPL Mo-Verb Plus | Plugin Alliance | cid=56535453504D5073706C206D6F2D7665; format=vst3 |
| valid | 7.57s (cache) | `C:\Program Files\Common Files\VST3\SPL TwinTube.vst3` | SPL TwinTube | Plugin Alliance | cid=5653545350545473706C207477696E74; format=vst3 |
| valid | 195ms (cache) | `C:\Program Files\Common Files\VST3\SSL GateVerb.vst3` | SSL GateVerb | SSL | cid=5653544754564273736C206761746576; format=vst3 |
| missing_license | 4.28s (cache) | `C:\Program Files\Common Files\VST3\SSL Native FlexVerb.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 68ms (cache) | `C:\Program Files\Common Files\VST3\SSL X-Orcism 2.vst3` | SSL X-Orcism 2 | SSL | cid=565354584F524373736C20782D6F7263; format=vst3 |
| valid | 133ms (cache) | `C:\Program Files\Common Files\VST3\STL ControlHub Beta.vst3` | STL ControlHub Beta | STL Tones | cid=5653544348504273746C20636F6E7472; format=vst3 |
| skipped_vendor | — | `C:\Program Files\Common Files\VST3\STL Ignite - AmpHub.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `C:\Program Files\Common Files\VST3\STL ToneHub.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| valid | 67ms (cache) | `C:\Program Files\Common Files\VST3\Slam2.vst3` | Slam2 | Beatskillz | cid=ABCDEF019182FAEB4D616E7542343574; format=vst3 |
| timed_out | 6.17s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\Fresh Air.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 4.88s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\Heatwave.vst3` | Heatwave | Slate Digital | cid=7BDEBCA60097455E00AFFF8E0004E27B; format=vst3 |
| valid | 1.07s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\Submerge.vst3` | Submerge | Slate Digital | cid=C4F076E5000249FF0003274A00DBAE1E; format=vst3 |
| missing_license | 2.33s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\VBC FG-Red.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 2.15s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\VM AirEQ Air.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.58s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\VM AirEQ Earth.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 2.69s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\VM FG-Bomber.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 2.71s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\VM Revival.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.66s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\VM The Monster.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 2.55s (cache) | `C:\Program Files\Common Files\VST3\Slate Digital\VM Trimmer.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 116ms (cache) | `C:\Program Files\Common Files\VST3\Sonic Labs Audio - The Josie TD3.vst3` | The Josie TD3 | Sonic Labs Audio | cid=ABCDEF019182FAEB5369634F546F7344; format=vst3 |
| valid | 14.1s (cache) | `C:\Program Files\Common Files\VST3\TBTECH Cenozoix Compressor.vst3` | TBTECH Cenozoix Compressor | Plugin Alliance | cid=56535430613669746274656368206365; format=vst3 |
| valid | 14.3s (cache) | `C:\Program Files\Common Files\VST3\TBTECH Kirchhoff-EQ.vst3` | TBTECH Kirchhoff-EQ | Plugin Alliance | cid=565354356D6267746274656368206B69; format=vst3 |
| valid | 20.6s (cache) | `C:\Program Files\Common Files\VST3\TBTECH Trinity Shaper.vst3` | TBTECH Trinity Shaper | Plugin Alliance | cid=56535468647539746274656368207472; format=vst3 |
| valid | 230ms (cache) | `C:\Program Files\Common Files\VST3\TONE3000.vst3` | TONE3000 | TONE3000 | cid=ABCDEF019182FAEB5446544654334B30; format=vst3 |
| valid | 294ms (cache) | `C:\Program Files\Common Files\VST3\Tommee Profitt - Epicizer.vst3` | Epicizer | Tommee Profitt | cid=ABCDEF019182FAEB546D6D5445706952; format=vst3 |
| valid | 272ms (cache) | `C:\Program Files\Common Files\VST3\Toneforge DI Match.vst3` | Toneforge DI Match | Joey Sturgis Tones | cid=ABCDEF019182FAEB4A5354785466646D; format=vst3 |
| missing_license | 9.27s (cache) | `C:\Program Files\Common Files\VST3\TrapTuneCore.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 21.5s (cache) | `C:\Program Files\Common Files\VST3\UFX-LOFI.vst3` | UFX-LOFI | UJAM | cid=ABCDEF019182FAEB554A414D55464C4F; format=vst3 |
| missing_license | 5.02s (cache) | `C:\Program Files\Common Files\VST3\UVI Tape Chorus.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.75s (cache) | `C:\Program Files\Common Files\VST3\UVI Tape Color.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 5.01s (cache) | `C:\Program Files\Common Files\VST3\UVI Tape Delay.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.35s (cache) | `C:\Program Files\Common Files\VST3\UVI Tape Flanger.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 14.0s (cache) | `C:\Program Files\Common Files\VST3\Uranium Drum Kit II.vst3` | Uranium Drum Kit II | Polarity Audio | cid=565354506175727572616E69756D2064; format=vst3 |
| missing_license | 4.41s (cache) | `C:\Program Files\Common Files\VST3\UrbanPuncher.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 5.93s (cache) | `C:\Program Files\Common Files\VST3\Valves.vst3` | Valves | AudioThing | cid=565354566C567376616C766573000000; format=vst3 |
| valid | 13.1s (cache) | `C:\Program Files\Common Files\VST3\Vaults.vst3` | Vaults | Crow Hill | cid=ABCDEF019182FAEB54434843EFBFBD7C; format=vst3 |
| missing_license | 4.17s (cache) | `C:\Program Files\Common Files\VST3\Verbum.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 12.7s (cache) | `C:\Program Files\Common Files\VST3\Vertigo VSS-2.vst3` | Vertigo VSS-2 | Plugin Alliance | cid=ABCDEF019182FAEB5665727456737374; format=vst3 |
| missing_license | 3.88s (cache) | `C:\Program Files\Common Files\VST3\VoxDucker.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 5.56s (cache) | `C:\Program Files\Common Files\VST3\WaveShell1-VST3 10.0_x64.vst3` | DeBreath Mono | Waves | cid=5653544252544D646562726561746820; format=vst3 |
| timed_out | 10.4s (cache) | `C:\Program Files\Common Files\VST3\WaveShell1-VST3 14.17_x64.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 4.84s (cache) | `C:\Program Files\Common Files\VST3\WaveShell1-VST3 14.21_x64.vst3` | Scheps Omni Channel 2 Mono | Waves | cid=5653544143534D736368657073206F6D; format=vst3 |
| valid | 3.78s (cache) | `C:\Program Files\Common Files\VST3\WaveShell1-VST3 14.25_x64.vst3` | Silk Vocal Live Mono | Waves | cid=5653544B504D4D73696C6B20766F6361; format=vst3 |
| valid | 4.00s (cache) | `C:\Program Files\Common Files\VST3\WaveShell1-VST3 16.6_x64.vst3` | Magma StressBox Mono | Waves | cid=5653544D53534D6D61676D6120737472; format=vst3 |
| valid | 4.42s (cache) | `C:\Program Files\Common Files\VST3\WaveShell1-VST3 16.7_x64.vst3` | Magma Lil Tube Mono | Waves | cid=5653544254464D6D61676D61206C696C; format=vst3 |
| valid | 3.62s (cache) | `C:\Program Files\Common Files\VST3\WaveShell3-VST3 10.0_x64.vst3` | Waves Tune Mono | Waves | cid=565354544E474D77617665732074756E; format=vst3 |
| valid | 106ms (cache) | `C:\Program Files\Common Files\VST3\Waveform Compressor.vst3` | Waveform Compressor | Woodstock Audio | cid=ABCDEF019182FAEB4D616E7547676E6A; format=vst3 |
| missing_license | 2.51s (cache) | `C:\Program Files\Common Files\VST3\WideFire.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\magic.METER.vst3` | magic.METER | MBM Audio | cid=ABCDEF019182FAEB4D626D614D6D7472; format=vst3 |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\noshige76.vst3` | noshige76 | noshigeSound | cid=ABCDEF019182FAEB4E73686753326D67; format=vst3 |
| valid | 45ms (cache) | `C:\Program Files\Common Files\VST3\uaudio_distressor.vst3` | UADx Empirical Labs Distressor | Universal Audio (UADx) | cid=ABCDEF019182FAEB5541447855334334; format=vst3 |
| valid | 7.70s (cache) | `H:\VSTPlugins\AIR\AIR Multiband Filterbank.vst3` | AIR Multiband Filterbank | AIR Music Technology | cid=ABCDEF019182FAEB4149526D416B6D66; format=vst3 |
| valid | 12.0s (cache) | `H:\VSTPlugins\AIR\AIR Tape Double Track.vst3` | AIR Tape Double Track | AIR Music Technology | cid=ABCDEF019182FAEB4149526D52454454; format=vst3 |
| valid | 597ms (cache) | `H:\VSTPlugins\Ablaze\Ablaze_BassDrop.vst3` | Bass Drop | Ablaze | cid=ABCDEF019182FAEB41626C7A42346470; format=vst3 |
| valid | 3.29s (cache) | `H:\VSTPlugins\Ablaze\Ablaze_Booster.vst3` | Booster | Ablaze | cid=ABCDEF019182FAEB41626C7A42307374; format=vst3 |
| valid | 242ms (cache) | `H:\VSTPlugins\Ablaze\Ablaze_Lifter.vst3` | Lifter | Ablaze | cid=ABCDEF019182FAEB41626C7A4C316674; format=vst3 |
| valid | 1.30s (cache) | `H:\VSTPlugins\Ablaze\Ablaze_Pitcher.vst3` | Pitcher | Ablaze | cid=ABCDEF019182FAEB41626C7A50317468; format=vst3 |
| valid | 2.81s (cache) | `H:\VSTPlugins\Ablaze\Ablaze_SnareBomb.vst3` | Snare Bomb | Ablaze | cid=ABCDEF019182FAEB41626C7A536E4230; format=vst3 |
| timed_out | 5.02s (cache) | `H:\VSTPlugins\Analog Obsession\LAEA.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 3.58s (cache) | `H:\VSTPlugins\Analog Obsession\LOVEND.vst3` | LOVEND | AnalogObsession | cid=F2AEE70D00DE4F4E416E6F624C4F5631; format=vst3 |
| timed_out | 7.78s (cache) | `H:\VSTPlugins\Analog Obsession\MuChild.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 837ms (cache) | `H:\VSTPlugins\Analog Obsession\TheBus.vst3` | TheBus | AnalogObsession | cid=F2AEE70D00DE4F4E416E6F6254425531; format=vst3 |
| timed_out | 5.67s (cache) | `H:\VSTPlugins\Analog Obsession\dBComp.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 29.5s (cache) | `H:\VSTPlugins\AnalogX\Genesis\AnalogX Genesis.vst3` | AnalogX Genesis | AnalogX | cid=ABCDEF019182FAEB4D616E7559336768; format=vst3 |
| valid | 17.6s (cache) | `H:\VSTPlugins\Arturia\Tape MELLO-FI.vst3` | Tape MELLO-FI | Arturia | cid=417274754156495354614D6550726F63; format=vst3 |
| valid | 7.35s (cache) | `H:\VSTPlugins\AtlasDSP\AtlasDSP DI Crank.vst3` | AtlasDSP DI Crank | AtlasDSP | cid=ABCDEF019182FAEB4D616E754469634B; format=vst3 |
| valid | 7.67s (cache) | `H:\VSTPlugins\AtlasDSP\AtlasDSP DI Ken.vst3` | AtlasDSP DI Ken | AtlasDSP | cid=ABCDEF019182FAEB4D616E7544694B4E; format=vst3 |
| valid | 7.01s (cache) | `H:\VSTPlugins\AtlasDSP\AtlasDSP Replacer.vst3` | AtlasDSP Replacer | AtlasDSP | cid=ABCDEF019182FAEB4D616E754F696E31; format=vst3 |
| valid | 579ms (cache) | `H:\VSTPlugins\Audio Assault\Amp Locker EX.vst3` | Amp Locker EX | Audio Assault | cid=ABCDEF019182FAEB41554153416C7072; format=vst3 |
| valid | 297ms (cache) | `H:\VSTPlugins\Audio Assault\Amp Locker.vst3` | Amp Locker | Audio Assault | cid=ABCDEF019182FAEB41554153414D504C; format=vst3 |
| valid | 568ms (cache) | `H:\VSTPlugins\Audio Assault\Head Crusher.vst3` | Head Crusher | 5DB5 | cid=ABCDEF019182FAEB3544423548433244; format=vst3 |
| valid | 510ms (cache) | `H:\VSTPlugins\Audio Assault\Mix Locker.vst3` | Mix Locker | Audio Assault | cid=ABCDEF019182FAEB415541534D584C4B; format=vst3 |
| valid | 3.64s (cache) | `H:\VSTPlugins\Audio Damage\Evil Otto.vst3` | Evil Otto | Audio Damage, Inc. | cid=ABCDEF019182FAEB417544614576696C; format=vst3 |
| timed_out | 6.94s (cache) | `H:\VSTPlugins\Baby Audio\TAIP.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| missing_license | 2.96s (cache) | `H:\VSTPlugins\Beatsurfing\RANDOM.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 260ms (cache) | `H:\VSTPlugins\Black Rooster Audio\VLA-3A.vst3` | VLA-3A | Black Rooster Audio | cid=ABCDEF019182FAEB42726162566C6133; format=vst3 |
| valid | 448ms (cache) | `H:\VSTPlugins\Black Rooster Audio\VLA-FET.vst3` | VLA-FET | Black Rooster Audio | cid=ABCDEF019182FAEB427261624C616674; format=vst3 |
| valid | 14.3s (cache) | `H:\VSTPlugins\Bogren Digital\IRDX Core.vst3` | IRDX Core | Bogren Digital | cid=ABCDEF019182FAEB4267726E49726478; format=vst3 |
| valid | 23.6s (cache) | `H:\VSTPlugins\Bogren Digital\IRDX Studio.vst3` | IRDX Studio | Bogren Digital | cid=ABCDEF019182FAEB4267726E49726473; format=vst3 |
| valid | 177ms (cache) | `H:\VSTPlugins\CARP Audio\Octapus.vst3` | Octapus | CARP Audio | cid=F8C698C46801448D912DC5D164398116; format=vst3 |
| valid | 347ms (cache) | `H:\VSTPlugins\Canvas Audio\Canvas Audio - 8K.vst3` | 8K | Canvas Audio | cid=ABCDEF019182FAEB436E764F4B636444; format=vst3 |
| valid | 25.3s (cache) | `H:\VSTPlugins\Canvas Audio\Canvas Audio - Cactus Clipper.vst3` | Cactus Clipper | Canvas Audio | cid=ABCDEF019182FAEB436E764F43637452; format=vst3 |
| valid | 23.9s (cache) | `H:\VSTPlugins\Canvas Audio\Canvas Audio - Oak Dynamic Tone Shaper.vst3` | Oak Dynamic Tone Shaper | Canvas Audio | cid=ABCDEF019182FAEB436E764F4F796E52; format=vst3 |
| valid | 16.7s (cache) | `H:\VSTPlugins\Canvas Audio\Canvas Audio - Prickly Clip.vst3` | Prickly Clip | Canvas Audio | cid=ABCDEF019182FAEB436E764F50696350; format=vst3 |
| valid | 194ms (cache) | `H:\VSTPlugins\Cymatics\Cymatics Diablo.vst3` | Cymatics Diablo | Cymatics | cid=ABCDEF019182FAEB43796D6143796C4F; format=vst3 |
| valid | 230ms (cache) | `H:\VSTPlugins\Cymatics\Cymatics MIDI Shredder.vst3` | Cymatics MIDI Shredder | Cymatics | cid=ABCDEF019182FAEB43796D784D536864; format=vst3 |
| missing_license | 4.38s (cache) | `H:\VSTPlugins\Cymatics\Cymatics Pandora.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 140ms (cache) | `H:\VSTPlugins\Cymatics\Cymatics Quake.vst3` | Cymatics Quake | Cymatics | cid=ABCDEF019182FAEB43796D6143716B65; format=vst3 |
| valid | 128ms (cache) | `H:\VSTPlugins\Cymatics\Cymatics Velvet.vst3` | Cymatics Velvet | Cymatics | cid=ABCDEF019182FAEB43796D6143766C76; format=vst3 |
| valid | 374ms (cache) | `H:\VSTPlugins\Darkstarz Technologies\DustBox.vst3` | DustBox | Darkstarz Technologies | cid=ABCDEF019182FAEB446B5374446B4462; format=vst3 |
| valid | 715ms (cache) | `H:\VSTPlugins\Decent Sampler\DecentSampler.vst3` | DecentSampler | Decidedly | cid=ABCDEF019182FAEB446C647944736D70; format=vst3 |
| timed_out | 5.81s (cache) | `H:\VSTPlugins\Drumforge\DF-SMACK.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 1.71s (cache) | `H:\VSTPlugins\Drumforge\DF-XCITE 2.vst3` | DF-XCITE 2 | Drumforge | cid=ABCDEF019182FAEB444D464744667874; format=vst3 |
| valid | 4.74s (cache) | `H:\VSTPlugins\Epica Audio\Master Tape.vst3` | Master Tape | Epica Audio | cid=ABCDEF019182FAEB4570696345414D54; format=vst3 |
| skipped_vendor | — | `H:\VSTPlugins\Excite Audio\Bloom Drum Machine.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\Excite Audio\Evolve Elastic.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\Excite Audio\Lifeline Console.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\Excite Audio\Lifeline Expanse.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\Excite Audio\Lifeline Format Module.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\Excite Audio\Motion Dimension.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\Excite Audio\Motion Harmonic.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| missing_license | 4.84s (cache) | `H:\VSTPlugins\Fine Classics\Subtle Spaces\Subtle Spaces.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 6.27s (cache) | `H:\VSTPlugins\Focusrite\fast-compressor_x64.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 6.17s (cache) | `H:\VSTPlugins\Focusrite\fast-reveal_x64.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 240ms (cache) | `H:\VSTPlugins\Jesus Oyola\The Bass Particle.vst3` | The Bass Particle | Jesus Oyola | cid=ABCDEF019182FAEB4A65734F42735074; format=vst3 |
| valid | 217ms (cache) | `H:\VSTPlugins\Joey Sturgis Tones\JST Extra Spice.vst3` | JST Extra Spice | Joey Sturgis Tones | cid=5653544A6578736A7374206578747261; format=vst3 |
| missing_license | 3.29s (cache) | `H:\VSTPlugins\Joey Sturgis Tones\Sidewidener II.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 209ms (cache) | `H:\VSTPlugins\KERN\KERN CHECK.vst3` | KERN CHECK | KERN Audio | cid=ABCDEF019182FAEB4B65726E4368636B; format=vst3 |
| valid | 1.08s (cache) | `H:\VSTPlugins\Laureano Studios\LaureanoStudios_Aura.vst3` | Aura | Laureano Studios | cid=ABCDEF019182FAEB4C34737441757234; format=vst3 |
| valid | 1.90s (cache) | `H:\VSTPlugins\Lunacy Audio\BEAM Filter.vst3` | BEAM Filter | Lunacy Audio | cid=ABCDEF019182FAEB4C756E61666C744C; format=vst3 |
| valid | 1.78s (cache) | `H:\VSTPlugins\Lunacy Audio\BEAM Haze.vst3` | BEAM Haze | Lunacy Audio | cid=ABCDEF019182FAEB4C756E6168617A4C; format=vst3 |
| timed_out | 7.66s (cache) | `H:\VSTPlugins\M Media Audio\Iron Deck.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| timed_out | 7.75s (cache) | `H:\VSTPlugins\M Media Audio\Violet Crown.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| timed_out | 7.68s (cache) | `H:\VSTPlugins\M Media Audio\Volume Dealer.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 24.3s (cache) | `H:\VSTPlugins\Mastering The Mix\ANIMATE.vst3` | ANIMATE | Mastering the Mix | cid=5653544D61416E616E696D6174650000; format=vst3 |
| valid | 22.7s (cache) | `H:\VSTPlugins\Mastering The Mix\FUSER.vst3` | FUSER | Mastering the Mix | cid=5653544D614675667573657200000000; format=vst3 |
| valid | 24.3s (cache) | `H:\VSTPlugins\Mastering The Mix\LEVELS.vst3` | LEVELS | Mastering the Mix | cid=ABCDEF019182FAEB4D61746D50614C65; format=vst3 |
| valid | 22.7s (cache) | `H:\VSTPlugins\Mastering The Mix\LIMITER.vst3` | LIMITER | Mastering the Mix | cid=ABCDEF019182FAEB4D61746D4C696D6F; format=vst3 |
| valid | 29.0s (cache) | `H:\VSTPlugins\Mastering The Mix\RESO.vst3` | RESO | Mastering the Mix | cid=ABCDEF019182FAEB4D61746D4D61526F; format=vst3 |
| missing_license | 30ms (cache) | `H:\VSTPlugins\MeldaProduction\Distortion\MBitFun.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 30ms (cache) | `H:\VSTPlugins\MeldaProduction\MSoundFactory.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 32ms (cache) | `H:\VSTPlugins\MeldaProduction\MSoundFactory6out.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 31ms (cache) | `H:\VSTPlugins\MeldaProduction\MTrackAlign.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 498ms (cache) | `H:\VSTPlugins\Minimal Audio\Cluster Delay.vst3` | Cluster Delay | Minimal | cid=ABCDEF019182FAEB4D696E6943444C59; format=vst3 |
| valid | 2.17s (cache) | `H:\VSTPlugins\Minimal Audio\Formant.vst3` | Formant | Minimal | cid=ABCDEF019182FAEB4D696E6946524D54; format=vst3 |
| valid | 1.21s (cache) | `H:\VSTPlugins\Minimal Audio\Hybrid Filter.vst3` | Hybrid Filter | Minimal | cid=ABCDEF019182FAEB4D696E694859464C; format=vst3 |
| valid | 1.02s (cache) | `H:\VSTPlugins\Moonbase\Rapid Flow\True AB.vst3` | True AB | Rapid Flow | cid=ABCDEF019182FAEB5261706954726162; format=vst3 |
| skipped_vendor | 17.0s (cache) | `H:\VSTPlugins\Native Instruments\Kontakt 7.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| missing_license | 8.43s (cache) | `H:\VSTPlugins\Neural DSP\Archetype Nolly X.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 6.00s (cache) | `H:\VSTPlugins\Neural DSP\Parallax X.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 577ms (cache) | `H:\VSTPlugins\Neutone\Neutone Terra.vst3` | Neutone Terra | Neutone | cid=ABCDEF019182FAEB4E544F4E4E747074; format=vst3 |
| valid | 3.26s (cache) | `H:\VSTPlugins\Niels\SUPER WIDE.vst3` | SUPER WIDE | Plea Tech | cid=ABCDEF019182FAEB506C656153776964; format=vst3 |
| missing_license | 3.87s (cache) | `H:\VSTPlugins\NoiseAsh\Backs EQ.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 10.8s (cache) | `H:\VSTPlugins\OLLO Audio\USC Calibration Beta VST3\USC Calibration Beta VST3.vst3` | USC Calibration Beta | OLLO Audio | cid=E1C0DAB330C142EB8F89E7822488E100; format=vst3 |
| valid | 269ms (cache) | `H:\VSTPlugins\Orchestral Tools Instrument\SINE Player.vst3` | SINE Player | Orchestral Tools | cid=5653545933353573696E6520706C6179; format=vst3 |
| missing_license | 3.28s (cache) | `H:\VSTPlugins\PHIL SPEISER\THE_SMOOTHER.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 1.01s (cache) | `H:\VSTPlugins\Pine DSP\VST3\Blox Delay.vst3` | Blox Delay | Pine DSP | cid=ABCDEF019182FAEB50494E4542444C59; format=vst3 |
| valid | 11.3s (cache) | `H:\VSTPlugins\Plugin Alliance\AMEK EQ 200.vst3` | AMEK EQ 200 | Plugin Alliance | cid=565354616D6571616D656B2065712032; format=vst3 |
| valid | 20.8s (cache) | `H:\VSTPlugins\Plugin Alliance\AMEK EQ 250.vst3` | AMEK EQ 250 | Plugin Alliance | cid=565354414D3235616D656B2065712032; format=vst3 |
| valid | 17.5s (cache) | `H:\VSTPlugins\Plugin Alliance\AMEK Mastering Compressor.vst3` | AMEK Mastering Compressor | Plugin Alliance | cid=565354414D436D616D656B206D617374; format=vst3 |
| valid | 7.77s (cache) | `H:\VSTPlugins\Plugin Alliance\Basslane.vst3` | Basslane | Tone Projects | cid=ABCDEF019182FAEB546F507262736C30; format=vst3 |
| valid | 14.9s (cache) | `H:\VSTPlugins\Plugin Alliance\Bettermaker BM60.vst3` | Bettermaker BM60 | Plugin Alliance | cid=ABCDEF019182FAEB426D6B72436F6378; format=vst3 |
| valid | 5.77s (cache) | `H:\VSTPlugins\Plugin Alliance\Bettermaker Bus Compressor DSP.vst3` | Bettermaker Bus Compressor DSP | Plugin Alliance | cid=ABCDEF019182FAEB426D6B724C783778; format=vst3 |
| valid | 5.88s (cache) | `H:\VSTPlugins\Plugin Alliance\Bettermaker C502V DSP.vst3` | Bettermaker C502V DSP | Plugin Alliance | cid=5653545A6970676265747465726D616B; format=vst3 |
| valid | 9.67s (cache) | `H:\VSTPlugins\Plugin Alliance\Bettermaker EQ232D.vst3` | Bettermaker EQ232D | Plugin Alliance | cid=565354583738636265747465726D616B; format=vst3 |
| valid | 5.72s (cache) | `H:\VSTPlugins\Plugin Alliance\Bettermaker Mastering Compressor DSP.vst3` | Bettermaker Mastering Compressor DSP | Plugin Alliance | cid=ABCDEF019182FAEB426D6B72426D6D63; format=vst3 |
| valid | 14.4s (cache) | `H:\VSTPlugins\Plugin Alliance\Bettermaker Passive Equalizer.vst3` | Bettermaker Passive Equalizer | Plugin Alliance | cid=565354427673706265747465726D616B; format=vst3 |
| valid | 5.63s (cache) | `H:\VSTPlugins\Plugin Alliance\Black Box Analog Design HG-2.vst3` | Black Box Analog Design HG-2 | Plugin Alliance | cid=56535442414832626C61636B20626F78; format=vst3 |
| valid | 5.52s (cache) | `H:\VSTPlugins\Plugin Alliance\Black Box Analog Design HG-2MS.vst3` | Black Box Analog Design HG-2MS | Plugin Alliance | cid=56535448324D53626C61636B20626F78; format=vst3 |
| valid | 8.55s (cache) | `H:\VSTPlugins\Plugin Alliance\Black Box Analog Design HG-Q.vst3` | Black Box Analog Design HG-Q | Plugin Alliance | cid=56535442414851626C61636B20626F78; format=vst3 |
| valid | 5.57s (cache) | `H:\VSTPlugins\Plugin Alliance\Diezel Herbert.vst3` | Diezel Herbert | Plugin Alliance | cid=565354445A48526469657A656C206865; format=vst3 |
| valid | 11.2s (cache) | `H:\VSTPlugins\Plugin Alliance\Diezel VH4.vst3` | Diezel VH4 | Plugin Alliance | cid=565354445A56686469657A656C207668; format=vst3 |
| valid | 10.1s (cache) | `H:\VSTPlugins\Plugin Alliance\ENGL E646 VS.vst3` | ENGL E646 VS | Plugin Alliance | cid=56535445363436656E676C2065363436; format=vst3 |
| valid | 11.2s (cache) | `H:\VSTPlugins\Plugin Alliance\ENGL E765 RT.vst3` | ENGL E765 RT | Plugin Alliance | cid=56535445373635656E676C2065373635; format=vst3 |
| valid | 10.7s (cache) | `H:\VSTPlugins\Plugin Alliance\ENGL Savage 120.vst3` | ENGL Savage 120 | Plugin Alliance | cid=56535445363130656E676C2073617661; format=vst3 |
| valid | 8.60s (cache) | `H:\VSTPlugins\Plugin Alliance\Friedman BE100.vst3` | Friedman BE100 | Plugin Alliance | cid=5653544231303066726965646D616E20; format=vst3 |
| valid | 7.59s (cache) | `H:\VSTPlugins\Plugin Alliance\Friedman Buxom Betty.vst3` | Friedman Buxom Betty | Plugin Alliance | cid=5653544258425466726965646D616E20; format=vst3 |
| valid | 7.23s (cache) | `H:\VSTPlugins\Plugin Alliance\Friedman DS40.vst3` | Friedman DS40 | Plugin Alliance | cid=5653544453343066726965646D616E20; format=vst3 |
| valid | 6.42s (cache) | `H:\VSTPlugins\Plugin Alliance\Fuchs Overdrive Supreme 50.vst3` | Fuchs Overdrive Supreme 50 | Plugin Alliance | cid=565354464F35306675636873206F7665; format=vst3 |
| valid | 6.19s (cache) | `H:\VSTPlugins\Plugin Alliance\Fuchs Train II.vst3` | Fuchs Train II | Plugin Alliance | cid=56535446544949667563687320747261; format=vst3 |
| valid | 6.21s (cache) | `H:\VSTPlugins\Plugin Alliance\Gallien Krueger 800RB.vst3` | Gallien Krueger 800RB | Plugin Alliance | cid=565354474B383067616C6C69656E206B; format=vst3 |
| valid | 13.2s (cache) | `H:\VSTPlugins\Plugin Alliance\Kiive XTComp.vst3` | Kiive XTComp | Plugin Alliance | cid=5653544B6178636B6969766520787463; format=vst3 |
| valid | 12.9s (cache) | `H:\VSTPlugins\Plugin Alliance\SPL IRON.vst3` | SPL IRON | Plugin Alliance | cid=5653545350495273706C2069726F6E00; format=vst3 |
| valid | 9.88s (cache) | `H:\VSTPlugins\Plugin Alliance\SPL Machine Head.vst3` | SPL Machine Head | Plugin Alliance | cid=ABCDEF019182FAEB53504C3153504D68; format=vst3 |
| valid | 27.3s (cache) | `H:\VSTPlugins\Plugin Alliance\SPL PQ.vst3` | SPL PQ | Plugin Alliance | cid=5653545350505173706C207071000000; format=vst3 |
| valid | 11.4s (cache) | `H:\VSTPlugins\Plugin Alliance\SPL Passeq Single.vst3` | SPL Passeq Single | Plugin Alliance | cid=5653545350503173706C207061737365; format=vst3 |
| valid | 8.81s (cache) | `H:\VSTPlugins\Plugin Alliance\SPL Passeq.vst3` | SPL Passeq | Plugin Alliance | cid=5653545350503273706C207061737365; format=vst3 |
| valid | 7.17s (cache) | `H:\VSTPlugins\Plugin Alliance\SPL Transient Designer Plus.vst3` | SPL Transient Designer Plus | Plugin Alliance | cid=5653545350545073706C207472616E73; format=vst3 |
| valid | 11.2s (cache) | `H:\VSTPlugins\Plugin Alliance\SPL Vitalizer MK3-T.vst3` | SPL Vitalizer MK3-T | Plugin Alliance | cid=5653545350563373706C20766974616C; format=vst3 |
| valid | 6.19s (cache) | `H:\VSTPlugins\Plugin Alliance\Shadow Hills Class A Mastering Comp.vst3` | Shadow Hills Class A Mastering Comp | Plugin Alliance | cid=5653545348524B736861646F77206869; format=vst3 |
| valid | 6.27s (cache) | `H:\VSTPlugins\Plugin Alliance\Shadow Hills Mastering Compressor.vst3` | Shadow Hills Mastering Compressor | Plugin Alliance | cid=56535453484D43736861646F77206869; format=vst3 |
| valid | 10.5s (cache) | `H:\VSTPlugins\Plugin Alliance\Shadow Hills OptoMax.vst3` | Shadow Hills OptoMax | Plugin Alliance | cid=56535453484F4D736861646F77206869; format=vst3 |
| valid | 3.83s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_XL V3.vst3` | bx_XL V3 | Plugin Alliance | cid=56535442584C3362785F786C20763300; format=vst3 |
| valid | 11.1s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_aura.vst3` | bx_aura | Plugin Alliance | cid=5653546278617562785F617572610000; format=vst3 |
| valid | 12.6s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_boom V3.vst3` | bx_boom V3 | Plugin Alliance | cid=5653546278623362785F626F6F6D2076; format=vst3 |
| valid | 9.08s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_clipper.vst3` | bx_clipper | Plugin Alliance | cid=5653546278386A62785F636C69707065; format=vst3 |
| valid | 10.7s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_crispyscale.vst3` | bx_crispyscale | Plugin Alliance | cid=5653545363614662785F637269737079; format=vst3 |
| valid | 8.54s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_crispytuner.vst3` | bx_crispytuner | Plugin Alliance | cid=56535454756E6162785F637269737079; format=vst3 |
| valid | 7.87s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_enhancer.vst3` | bx_enhancer | Plugin Alliance | cid=5653546278456E62785F656E68616E63; format=vst3 |
| valid | 6.97s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_glue.vst3` | bx_glue | Plugin Alliance | cid=5653546278676C62785F676C75650000; format=vst3 |
| valid | 6.38s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_limiter.vst3` | bx_limiter | Plugin Alliance | cid=56535462786C6D62785F6C696D697465; format=vst3 |
| valid | 6.19s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_pulsar.vst3` | bx_pulsar | Plugin Alliance | cid=5653546278707562785F70756C736172; format=vst3 |
| valid | 6.15s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_refinement V3.vst3` | bx_refinement V3 | Plugin Alliance | cid=5653546278663362785F726566696E65; format=vst3 |
| valid | 6.12s (cache) | `H:\VSTPlugins\Plugin Alliance\bx_tuner.vst3` | bx_tuner | Plugin Alliance | cid=5653546278746E62785F74756E657200; format=vst3 |
| valid | 13.5s (cache) | `H:\VSTPlugins\Plugin Alliance\fiedler audio splat.vst3` | fiedler audio splat | Plugin Alliance | cid=ABCDEF019182FAEB4649415553504C54; format=vst3 |
| valid | 5.83s (cache) | `H:\VSTPlugins\Plugin Alliance\fiedler audio stage.vst3` | fiedler audio stage | Plugin Alliance | cid=ABCDEF019182FAEB4649415553544147; format=vst3 |
| valid | 71ms (cache) | `H:\VSTPlugins\Plugin Boutique\DriveLE.vst3` | DriveLE | Plugin Boutique | cid=ABCDEF019182FAEB706962544472314C; format=vst3 |
| valid | 66ms (cache) | `H:\VSTPlugins\Plugin Boutique\DriveMod.vst3` | DriveMod | Plugin Boutique | cid=ABCDEF019182FAEB7069625444723176; format=vst3 |
| valid | 48ms (cache) | `H:\VSTPlugins\Plugin Boutique\Exceed.vst3` | Exceed | Plugin Boutique | cid=ABCDEF019182FAEB7069625445786333; format=vst3 |
| valid | 68ms (cache) | `H:\VSTPlugins\Plugin Boutique\FilterMod.vst3` | FilterMod | Plugin Boutique | cid=ABCDEF019182FAEB7069625446316D6F; format=vst3 |
| valid | 46ms (cache) | `H:\VSTPlugins\Plugin Boutique\ResDelay.vst3` | ResDelay | Plugin Boutique | cid=ABCDEF019182FAEB70696254456E6433; format=vst3 |
| valid | 75ms (cache) | `H:\VSTPlugins\Plugin Boutique\ShapeMod.vst3` | ShapeMod | Plugin Boutique | cid=ABCDEF019182FAEB7069625453683470; format=vst3 |
| valid | 65ms (cache) | `H:\VSTPlugins\Plugin Boutique\WaveOSC.vst3` | WaveOSC | Plugin Boutique | cid=ABCDEF019182FAEB7069625457344F53; format=vst3 |
| valid | 3.63s (cache) | `H:\VSTPlugins\Plugins That Knock\KNOCK Clipper.vst3` | KNOCK Clipper | Plugins That Knock | cid=ABCDEF019182FAEB4D616E754C677563; format=vst3 |
| valid | 555ms (cache) | `H:\VSTPlugins\Pointless Audio\PA AlphaRail.vst3` | PA AlphaRail | Pointless Audio | cid=ABCDEF019182FAEB50746C41416C7052; format=vst3 |
| valid | 616ms (cache) | `H:\VSTPlugins\Pointless Audio\PA SnakePit.vst3` | PA SnakePit | Pointless Audio | cid=ABCDEF019182FAEB50746C41536E6B50; format=vst3 |
| valid | 20.5s (cache) | `H:\VSTPlugins\Purafied Audio\DEATHWESTERN.vst3` | DEATHWESTERN | Purafied Audio | cid=56535450737764646561746877657374; format=vst3 |
| valid | 17.6s (cache) | `H:\VSTPlugins\Purafied Audio\LED Compressor.vst3` | LED Compressor | Purafied Audio | cid=565354506C636F6C656420636F6D7072; format=vst3 |
| valid | 15.8s (cache) | `H:\VSTPlugins\Purafied Audio\Liquid Death Snare.vst3` | Liquid Death Snare | Purafied Audio | cid=56535450756C646C6971756964206465; format=vst3 |
| valid | 21.8s (cache) | `H:\VSTPlugins\Purafied Audio\Micro Limiter.vst3` | Micro Limiter | Purafied Audio | cid=565354506D726C6D6963726F206C696D; format=vst3 |
| valid | 25.9s (cache) | `H:\VSTPlugins\Purafied Audio\Purafied 5420.vst3` | Purafied 5420 | Purafied Audio | cid=56535450757866707572616669656420; format=vst3 |
| valid | 15.6s (cache) | `H:\VSTPlugins\Purafied Audio\SLP 538 EQ.vst3` | SLP 538 EQ | Purafied Audio | cid=56535450617365736C70203533382065; format=vst3 |
| valid | 20.7s (cache) | `H:\VSTPlugins\Purafied Audio\The Panda Rooms m to s.vst3` | The Panda Rooms m to s | Purafied Audio | cid=565354507470737468652070616E6461; format=vst3 |
| valid | 26.1s (cache) | `H:\VSTPlugins\Purafied Audio\The Panda Rooms.vst3` | The Panda Rooms | Purafied Audio | cid=565354507470727468652070616E6461; format=vst3 |
| valid | 16.8s (cache) | `H:\VSTPlugins\Purafied Audio\VU Compressor.vst3` | VU Compressor | Purafied Audio | cid=56535450617675767520636F6D707265; format=vst3 |
| valid | 1.31s (cache) | `H:\VSTPlugins\SSL\SSL DeEss.vst3` | SSL DeEss | SSL | cid=ABCDEF019182FAEB53534C4E44455353; format=vst3 |
| valid | 2.25s (cache) | `H:\VSTPlugins\SSL\SSL Fusion Vintage Drive.vst3` | SSL Fusion Vintage Drive | SSL | cid=5653545644525673736C20667573696F; format=vst3 |
| valid | 901ms (cache) | `H:\VSTPlugins\SSL\SSL G3 MultiBusComp.vst3` | SSL G3 MultiBusComp | SSL | cid=56535447336D6373736C206733206D75; format=vst3 |
| valid | 1.47s (cache) | `H:\VSTPlugins\SSL\SSL Native Bus Compressor 2.vst3` | SSL Native Bus Compressor 2 | SSL | cid=5653544E42433273736C206E61746976; format=vst3 |
| valid | 1.22s (cache) | `H:\VSTPlugins\SSL\SSL Native Channel Strip 2.vst3` | SSL Native Channel Strip 2 | SSL | cid=5653544E43533273736C206E61746976; format=vst3 |
| valid | 2.07s (cache) | `H:\VSTPlugins\SSL\SSL Native Vocalstrip 2.vst3` | SSL Native Vocalstrip 2 | SSL | cid=565354534E563273736C206E61746976; format=vst3 |
| valid | 1.33s (cache) | `H:\VSTPlugins\SSL\SSL Native X-Comp v6.vst3` | SSL Native X-Comp v6 | SSL | cid=565354534E584373736C206E61746976; format=vst3 |
| valid | 1.23s (cache) | `H:\VSTPlugins\SSL\SSL Native X-Saturator v6.vst3` | SSL Native X-Saturator v6 | SSL | cid=565354534E585373736C206E61746976; format=vst3 |
| valid | 936ms (cache) | `H:\VSTPlugins\SSL\SSL Native X-ValveComp v6.vst3` | SSL Native X-ValveComp v6 | SSL | cid=565354534E585673736C206E61746976; format=vst3 |
| valid | 1.22s (cache) | `H:\VSTPlugins\SSL\SSL Sourcerer.vst3` | SSL Sourcerer | SSL | cid=5653545352435273736C20736F757263; format=vst3 |
| valid | 1.37s (cache) | `H:\VSTPlugins\SSL\SSL X-Limit.vst3` | SSL X-Limit | SSL | cid=565354584C4D5473736C20782D6C696D; format=vst3 |
| skipped_vendor | — | `H:\VSTPlugins\STL Tones\STL ControlHub.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\STL Tones\STL Ignite - AmpHub.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| skipped_vendor | — | `H:\VSTPlugins\STL Tones\STL ToneHub.vst3` | — | — | Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope) |
| valid | 369ms (cache) | `H:\VSTPlugins\Slate Digital\Fresh Air.vst3` | Fresh Air | Slate Digital | cid=CD4CA2F2009849AC00439BB9001CB96A; format=vst3 |
| missing_license | 4.16s (cache) | `H:\VSTPlugins\Slate Digital\VM FG-36A.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.93s (cache) | `H:\VSTPlugins\Slate Digital\VM FG-73.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.95s (cache) | `H:\VSTPlugins\Slate Digital\VM FG-76.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.93s (cache) | `H:\VSTPlugins\Slate Digital\VM Hollywood.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.20s (cache) | `H:\VSTPlugins\Slate Digital\VM London.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.84s (cache) | `H:\VSTPlugins\Slate Digital\VM New York.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.90s (cache) | `H:\VSTPlugins\Slate Digital\VM Revival.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.43s (cache) | `H:\VSTPlugins\Slate Digital\VM The Monster.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.19s (cache) | `H:\VSTPlugins\Slate Digital\Virtual Mix Rack.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 1.36s (cache) | `H:\VSTPlugins\Softube\Amplifiers.vst3` | Amplifiers | Softube | cid=3C5238D0D4E14756ACF473222547A44E; format=vst3 |
| valid | 683ms (cache) | `H:\VSTPlugins\Softube\Blaze Works Amplification.vst3` | Blaze Works Amplification | Softube | cid=96E0BA7217BA435ABE81EF31C71F161E; format=vst3 |
| valid | 3.05s (cache) | `H:\VSTPlugins\Softube\Clipper.vst3` | Clipper | Softube | cid=E34FA6DCE5AA440FA9926C2892586C64; format=vst3 |
| timed_out | 6.30s (cache) | `H:\VSTPlugins\Softube\VCA Compressor.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| missing_license | 3.39s (cache) | `H:\VSTPlugins\Sonible\Balancer_x64.vst3` | — | — | License protection detected; DLL load skipped |
| timed_out | 5.77s (cache) | `H:\VSTPlugins\Sonnox\Oxford Inflator Native.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| timed_out | 5.73s (cache) | `H:\VSTPlugins\Sonnox\Sonnox Soften.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 571ms (cache) | `H:\VSTPlugins\Spitfire Audio\LABS.vst3` | LABS | Spitfire Audio | cid=56535453664C626C6162730000000000; format=vst3 |
| valid | 304ms (cache) | `H:\VSTPlugins\Tone Empire\LocnessV3.vst3` | LocnessV3 | Tone Empire | cid=ABCDEF019182FAEB4D616E756C636E33; format=vst3 |
| valid | 220ms (cache) | `H:\VSTPlugins\Tone Empire\OptoRedV3.vst3` | OptoRedV3 | Tone Empire | cid=ABCDEF019182FAEB4D616E756F707233; format=vst3 |
| valid | 24.7s (cache) | `H:\VSTPlugins\Tone Empire\VST3\EDYNpre.vst3` | EDYNpre | Tone Empire | cid=ABCDEF019182FAEB4D616E754544594E; format=vst3 |
| valid | 19.2s (cache) | `H:\VSTPlugins\Tone Empire\VST3\Firechild.vst3` | FireChild | Tone Empire | cid=ABCDEF019182FAEB4D616E7573646661; format=vst3 |
| valid | 24.6s (cache) | `H:\VSTPlugins\Tone Empire\VST3\GoliathV2.vst3` | GoliathV2 | Tone Empire | cid=ABCDEF019182FAEB4D616E75506D6365; format=vst3 |
| valid | 10.8s (cache) | `H:\VSTPlugins\Tone Empire\VST3\ReelightPro.vst3` | ReelightPro | Tone Empire | cid=ABCDEF019182FAEB4D616E75536A727A; format=vst3 |
| valid | 23.5s (cache) | `H:\VSTPlugins\UJAM\BEATMAKER.vst3` | BEATMAKER | UJAM | cid=ABCDEF019182FAEB4C43415342454154; format=vst3 |
| valid | 26.4s (cache) | `H:\VSTPlugins\UJAM\BM-KANDY.vst3` | BM-KANDY | UJAM | cid=ABCDEF019182FAEB554A414D424D4B41; format=vst3 |
| valid | 19.4s (cache) | `H:\VSTPlugins\UJAM\GM-ONE.vst3` | GM-ONE | UJAM | cid=ABCDEF019182FAEB554A414D474D4F4E; format=vst3 |
| valid | 17.8s (cache) | `H:\VSTPlugins\UJAM\UFX-REVERB2.vst3` | UFX-REVERB2 | UJAM | cid=ABCDEF019182FAEB554A414D55465232; format=vst3 |
| valid | 19.9s (cache) | `H:\VSTPlugins\UJAM\VD-LEGEND.vst3` | VD-LEGEND | UJAM | cid=ABCDEF019182FAEB554A414D56444C45; format=vst3 |
| valid | 18.0s (cache) | `H:\VSTPlugins\UJAM\VG-SILK2.vst3` | VG-SILK2 | UJAM | cid=ABCDEF019182FAEB554A414D56475349; format=vst3 |
| missing_license | 5.90s (cache) | `H:\VSTPlugins\United Plugins\Autoformer.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 5.18s (cache) | `H:\VSTPlugins\United Plugins\CyberdriveCore.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 5.10s (cache) | `H:\VSTPlugins\United Plugins\DIFIX.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.88s (cache) | `H:\VSTPlugins\United Plugins\FireCharger.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 7.77s (cache) | `H:\VSTPlugins\United Plugins\FireEQ.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 6.05s (cache) | `H:\VSTPlugins\United Plugins\FireMaximizer.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 5.43s (cache) | `H:\VSTPlugins\United Plugins\FirePreamp.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.82s (cache) | `H:\VSTPlugins\United Plugins\Orbitron.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 7.82s (cache) | `H:\VSTPlugins\United Plugins\OrbitronCore.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 5.54s (cache) | `H:\VSTPlugins\United Plugins\UrbanPuncher.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 5.00s (cache) | `H:\VSTPlugins\United Plugins\Verbum.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 4.82s (cache) | `H:\VSTPlugins\United Plugins\VoxDucker.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 7.20s (cache) | `H:\VSTPlugins\United Plugins\WideFire.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 113ms (cache) | `H:\VSTPlugins\Universal Audio\uaudio_oxide_tape.vst3` | UADx Oxide Tape Recorder | Universal Audio (UADx) | cid=ABCDEF019182FAEB5541447855334244; format=vst3 |
| valid | 69ms (cache) | `H:\VSTPlugins\Universal Audio\uaudio_pultec_eqp-1a.vst3` | UADx Pultec EQP-1A EQ | Universal Audio (UADx) | cid=ABCDEF019182FAEB554144785533414E; format=vst3 |
| valid | 99ms (cache) | `H:\VSTPlugins\Universal Audio\uaudio_pultec_hlf-3c.vst3` | UADx Pultec HLF-3C EQ | Universal Audio (UADx) | cid=ABCDEF019182FAEB5541447855334150; format=vst3 |
| valid | 71ms (cache) | `H:\VSTPlugins\Universal Audio\uaudio_pultec_meq-5.vst3` | UADx Pultec MEQ-5 EQ | Universal Audio (UADx) | cid=ABCDEF019182FAEB5541447855334152; format=vst3 |
| valid | 90ms (cache) | `H:\VSTPlugins\Universal Audio\uaudio_pure_plate.vst3` | UADx Pure Plate Reverb | Universal Audio (UADx) | cid=ABCDEF019182FAEB5541447855334332; format=vst3 |
| valid | 72ms (cache) | `H:\VSTPlugins\Universal Audio\uaudio_teletronix_la-2a_tc.vst3` | UADx LA-2A Tube Compressor | Universal Audio (UADx) | cid=ABCDEF019182FAEB554144785533444A; format=vst3 |
| valid | 83ms (cache) | `H:\VSTPlugins\Universal Audio\uaudio_ua_1176.vst3` | UADx 1176 FET Compressor | Universal Audio (UADx) | cid=ABCDEF019182FAEB5541447855334459; format=vst3 |
| valid | 5.82s (cache) | `H:\VSTPlugins\Vital\Vital.vst3` | Vital | Vital Audio | cid=56535456697461766974616C00000000; format=vst3 |
| valid | 5.87s (cache) | `H:\VSTPlugins\WAProductions\Combustor.vst3` | Combustor | W.A.Production | cid=56535443306D73636F6D627573746F72; format=vst3 |
| missing_license | 2.31s (cache) | `H:\VSTPlugins\WAProductions\Deres.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 5.86s (cache) | `H:\VSTPlugins\WAProductions\FundamentalBass.vst3` | Fundamental Bass | W.A.Production | cid=565354466E643466756E64616D656E74; format=vst3 |
| valid | 51ms (cache) | `H:\VSTPlugins\WAProductions\ListenerLoopEngine3.vst3` | ListenerLoopEngine3 | W.A.Production | cid=ABCDEF019182FAEB5265434D4C334C4C; format=vst3 |
| valid | 49ms (cache) | `H:\VSTPlugins\WAProductions\LoopEngine3.vst3` | LoopEngine3 | W.A.Production | cid=ABCDEF019182FAEB5265434D4C334C73; format=vst3 |
| valid | 5.91s (cache) | `H:\VSTPlugins\WAProductions\Outlaw.vst3` | Outlaw | W.A.Production | cid=56535430546C776F75746C6177000000; format=vst3 |
| missing_license | 4.38s (cache) | `H:\VSTPlugins\WAProductions\RedClip.vst3` | — | — | License protection detected; DLL load skipped |
| missing_license | 3.70s (cache) | `H:\VSTPlugins\WAProductions\Squelcher.vst3` | — | — | License protection detected; DLL load skipped |
| valid | 5.88s (cache) | `H:\VSTPlugins\WAProductions\VocalLimiter.vst3` | Vocal Limiter | W.A.Production | cid=56535456306C69766F63616C206C696D; format=vst3 |
| timed_out | 7.07s (cache) | `H:\VSTPlugins\Wavemind\NAM Universal II.vst3` | — | — | Timed out loading plugin (hung initializer or modal UI) |
| valid | 10.3s (cache) | `H:\VSTPlugins\Wavesfactory\Equalizer.vst3` | Equalizer | Wavesfactory | cid=ABCDEF019182FAEB5773467945715A72; format=vst3 |
| valid | 10.5s (cache) | `H:\VSTPlugins\Wavesfactory\Trackspacer25.vst3` | Trackspacer 2.5 | Wavesfactory | cid=565354546B3235747261636B73706163; format=vst3 |
| valid | 289ms (cache) | `H:\VSTPlugins\schulz.audio\Spectrum 2.vst3` | Spectrum 2 | schulz.audio | cid=56535442535032737065637472756D20; format=vst3 |

## Warnings

_None._

## Errors

- C:\Program Files (x86)\Common Files\VST3\WaveShell1-VST3 10.0.vst3 — LoadLibraryW failed with error number: 193 for path C:\Program Files (x86)\Common Files\VST3\WaveShell1-VST3 10.0.vst3
- C:\Program Files (x86)\Common Files\VST3\WaveShell3-VST3 10.0.vst3 — LoadLibraryW failed with error number: 193 for path C:\Program Files (x86)\Common Files\VST3\WaveShell3-VST3 10.0.vst3

