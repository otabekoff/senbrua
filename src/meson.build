app_conf = configuration_data()
app_conf.set('profile', profile)
app_conf.set('prefix', senbrua_prefix)
app_conf.set('libdir', senbrua_libdir)
app_conf.set('PACKAGE_VERSION', meson.project_version() + version_suffix)
app_conf.set('GJS', gjs_console)
app_conf.set('APPLICATION_ID', application_id)

app = configure_file(
  input: 'uz.mohirlab.senbrua.in',
  output: application_id,
  install: true,
  install_dir: senbrua_pkgdatadir,
  configuration: app_conf
)

sources = files(
  'application.ts',
  'main.ts',
  'recorder.ts',
  'recorderWidget.ts',
  'recording.ts',
  'recordingList.ts',
  'recordingListWidget.ts',
  'row.ts',
  'utils.ts',
  'waveform.ts',
  'window.ts',
)

if skip_ts
  # Use pre-compiled JavaScript from source tree when skipping compilation
  tsc_out = meson.project_source_root() / 'tsc-out'
  typescript = disabler()
  message('Using pre-compiled JavaScript from ' + tsc_out)
else
  tsc_out = meson.project_build_root() / 'tsc-out'
  typescript = custom_target(
    'typescript-compile',
    input: sources,
    build_by_default: true,
    build_always_stale: true,
    command: [ tsc, '--project', meson.project_source_root(), '--outDir', tsc_out ],
    output: ['tsc-output'],
  )
endif

source_res_conf = configuration_data()
source_res_conf.set('profile', profile)

if skip_ts
  src_res = gnome.compile_resources(
    application_id + '.src',
    configure_file(
      input: 'uz.mohirlab.senbrua.src.gresource.xml.in',
      output: '@BASENAME@',
      configuration: source_res_conf
    ),
    source_dir: tsc_out,
    gresource_bundle: true,
    install: true,
    install_dir: senbrua_pkgdatadir
  )
else
  src_res = gnome.compile_resources(
    application_id + '.src',
    configure_file(
      input: 'uz.mohirlab.senbrua.src.gresource.xml.in',
      output: '@BASENAME@',
      configuration: source_res_conf
    ),
    dependencies: typescript,
    source_dir: tsc_out,
    gresource_bundle: true,
    install: true,
    install_dir: senbrua_pkgdatadir
  )
endif

run_target('run',
  command: app,
  depends: [
    data_res,
    src_res,
  ]
)
