project(
  'senbrua',
  version: '1.0.0',
  license: 'GPL-3.0-or-later',
  meson_version: '>= 0.63.0',
)

if get_option('profile') == 'development'
  profile = '.Devel'
  name_suffix = ' (Development)'
  vcs_tag = run_command('git', 'rev-parse', '--short', 'HEAD', check: false).stdout().strip()
  if vcs_tag == ''
    version_suffix = '-devel'
  else
    version_suffix = '-@0@'.format(vcs_tag)
  endif
else
  profile = ''
  name_suffix = ''
  version_suffix = ''
endif

application_id = 'io.github.senbrua@0@'.format(profile)

gettext_package = application_id
senbrua_prefix = get_option('prefix')
senbrua_bindir = senbrua_prefix / get_option('bindir')
senbrua_libdir = senbrua_prefix / get_option('libdir')
senbrua_datadir = senbrua_prefix / get_option('datadir')
senbrua_pkgdatadir = senbrua_datadir / application_id

senbrua_schemadir = senbrua_datadir / 'glib-2.0' / 'schemas'

po_dir = meson.project_source_root() / 'po'

gjs_dep = dependency('gjs-1.0', version: '>= 1.54.0')
gjs_console = gjs_dep.get_variable(pkgconfig: 'gjs_console')

# Check dependencies
dependency('gio-2.0', version: '>= 2.43.4')
dependency('glib-2.0', version: '>= 2.39.3')
dependency('gtk4', version: '>= 4.10.0')
dependency('gstreamer-player-1.0', version: '>= 1.12')
dependency('libadwaita-1', version: '>= 1.4')
dependency('gobject-introspection-1.0', version: '>= 1.31.6')
dependency('gstreamer-1.0')
dependency('gstreamer-pbutils-1.0')

gnome = import('gnome')
i18n = import('i18n')

tsc = find_program('tsc', required: true)

subdir('data')
subdir('src')
subdir('po')

install_symlink(
  meson.project_name(),
  pointing_to: senbrua_pkgdatadir / application_id,
  install_dir: senbrua_bindir
)

gnome.post_install(
  glib_compile_schemas: true,
  gtk_update_icon_cache: true,
  update_desktop_database: true,
)
