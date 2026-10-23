// Gera o projeto Android (TWA) do app Juju Jacaré e compila AAB/APK. Roda no GitHub Actions.
const core = require('@bubblewrap/core');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync(__dirname + '/build.json', 'utf8'));
(async () => {
  const log = new core.ConsoleLog('juju');
  const MURL = 'https://jujujacare.com.br/manifest.webmanifest';
  const wm = process.env.LOCAL_MANIFEST ? JSON.parse(fs.readFileSync(process.env.LOCAL_MANIFEST, 'utf8')) : null;
  const base = wm ? core.TwaManifest.fromWebManifestJson(new URL(MURL), wm) : await core.TwaManifest.fromWebManifest(MURL);
  const j = base.toJson();
  Object.assign(j, {
    packageId: cfg.packageId, host: 'jujujacare.com.br', name: 'Juju Jacaré', launcherName: 'Juju Jacaré',
    startUrl: cfg.startUrl, display: 'standalone', orientation: 'default',
    themeColor: '#5cc93b', navigationColor: '#5cc93b', backgroundColor: '#5cc93b',
    iconUrl: 'https://jujujacare.com.br/icon-512.png', maskableIconUrl: 'https://jujujacare.com.br/icon-mask-512.png',
    enableNotifications: false, shortcuts: [], fallbackType: 'customtabs', enableSiteSettingsShortcut: false,
    appVersionCode: cfg.appVersionCode, appVersionName: cfg.appVersionName, appVersion: cfg.appVersionName,
    themeColorDark: '#3a9a22', navigationColorDark: '#3a9a22', navigationDividerColor: '#5cc93b', navigationDividerColorDark: '#3a9a22',
    signingKey: { path: process.cwd() + '/android.keystore', alias: 'juju' },
  });
  const twa = new core.TwaManifest(j);
  const v = twa.validate(); if (v) throw new Error(v);
  const dir = process.cwd() + '/proj';
  fs.mkdirSync(dir, { recursive: true });
  await twa.saveToFile(dir + '/twa-manifest.json');
  if (process.env.ONLY_MANIFEST) { console.log(fs.readFileSync(dir + '/twa-manifest.json', 'utf8')); return; }
  await new core.TwaGenerator().createTwaProject(dir, twa, log);
  const config = new core.Config(process.env.JAVA_HOME, process.env.ANDROID_HOME);
  const jdk = new core.JdkHelper(process, config);
  if (!fs.existsSync('android.keystore')) {
    await new core.KeyTool(jdk, log).createSigningKey({ path: 'android.keystore', alias: 'juju', password: process.env.PW, keypassword: process.env.PW,
      fullName: 'Juju Jacare', organizationalUnit: 'Apps', organization: 'Juju Jacare', country: 'BR' });
  }
  const sdk = await core.AndroidSdkTools.create(process, config, jdk, log);
  process.chdir(dir);
  const g = new core.GradleWrapper(process, sdk);
  await g.bundleRelease();
  await g.assembleRelease();
  log.info('ok');
})().catch(e => { console.error(e); process.exit(1); });
