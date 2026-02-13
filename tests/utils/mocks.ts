export const MOCK_LOGS = [
  // Day 0 (Feb 11)
  { timestamp: '2026-02-11T08:12:00Z', domain: 'app.fake-analytics.xyz', root: 'fake-analytics.xyz', tracker: 'FakeTrackerLol', protocol: 'DNS-over-HTTPS', status: 'blocked', device: { name: 'DEVICE_1' } },
  { timestamp: '2026-02-11T09:30:00Z', domain: 'cdn.placeholder.test', root: 'placeholder.test', tracker: '', protocol: 'DNS-over-HTTPS', status: 'default', device: { name: 'DEVICE_2' } },
  { timestamp: '2026-02-11T10:45:00Z', domain: 'api.mockservice.dev', root: 'mockservice.dev', tracker: '', protocol: 'DNS-over-TLS', status: 'allowed', device: { name: 'DEVICE_1' } },
  { timestamp: '2026-02-11T11:00:00Z', domain: 'ads.spamnetwork.fake', root: 'spamnetwork.fake', tracker: 'SpamTracker', protocol: 'UDP', status: 'blocked', device: { name: 'DEVICE_2' } },
  { timestamp: '2026-02-11T14:22:00Z', domain: 'pixel.sneakycorp.xyz', root: 'sneakycorp.xyz', tracker: 'SneakyCorp', protocol: 'DNS-over-HTTPS', status: 'blocked', device: { name: 'DEVICE_1' } },

  // Day -3 (Feb 8)
  { timestamp: '2026-02-08T06:10:00Z', domain: 'mail.safemail.test', root: 'safemail.test', tracker: '', protocol: 'DNS-over-QUIC', status: 'allowed', device: { name: 'DEVICE_2' } },
  { timestamp: '2026-02-08T18:55:00Z', domain: 'telemetry.bogusapp.fake', root: 'bogusapp.fake', tracker: 'BogusMetrics', protocol: 'DNS-over-TLS', status: 'blocked', device: { name: 'DEVICE_1' } },

  // Day +2 (Feb 13)
  { timestamp: '2026-02-13T07:00:00Z', domain: 'static.dummycdn.xyz', root: 'dummycdn.xyz', tracker: '', protocol: 'DNS-over-HTTPS', status: 'default', device: { name: 'DEVICE_1' } },
  { timestamp: '2026-02-13T12:30:00Z', domain: 'track.admonster.fake', root: 'admonster.fake', tracker: 'AdMonster', protocol: 'UDP', status: 'blocked', device: { name: 'DEVICE_2' } },

  // Day -7 (Feb 4)
  { timestamp: '2026-02-04T22:15:00Z', domain: 'home.localnet.test', root: 'localnet.test', tracker: '', protocol: 'UDP', status: 'default', device: { name: 'DEVICE_2' } },
  { timestamp: '2026-02-04T23:00:00Z', domain: 'spy.creepytracker.xyz', root: 'creepytracker.xyz', tracker: 'CreepyTracker', protocol: 'DNS-over-TLS', status: 'blocked', device: { name: 'DEVICE_1' } },

  // Day +5 (Feb 16)
  { timestamp: '2026-02-16T15:45:00Z', domain: 'img.fakesocial.dev', root: 'fakesocial.dev', tracker: 'FakeSocial', protocol: 'DNS-over-HTTPS', status: 'allowed', device: { name: 'DEVICE_2' } },
  { timestamp: '2026-02-16T16:00:00Z', domain: 'broken.nowhere.invalid', root: 'nowhere.invalid', tracker: '', protocol: 'UDP', status: 'error', device: { name: 'DEVICE_1' } },

  // Day -5 (Feb 6)
  { timestamp: '2026-02-06T03:20:00Z', domain: 'sync.dataslurp.fake', root: 'dataslurp.fake', tracker: 'DataSlurp', protocol: 'DNS-over-HTTPS', status: 'blocked', device: { name: 'DEVICE_2' } },
  { timestamp: '2026-02-06T11:10:00Z', domain: 'docs.cleansite.test', root: 'cleansite.test', tracker: '', protocol: 'DNS-over-TLS', status: 'allowed', device: { name: 'DEVICE_1' } },

  // Day +7 (Feb 18)
  { timestamp: '2026-02-18T09:00:00Z', domain: 'beacon.megaspy.xyz', root: 'megaspy.xyz', tracker: 'MegaSpy', protocol: 'UDP', status: 'blocked', device: { name: 'DEVICE_1' } },
  { timestamp: '2026-02-18T20:30:00Z', domain: 'files.legit-storage.dev', root: 'legit-storage.dev', tracker: '', protocol: 'DNS-over-QUIC', status: 'default', device: { name: 'DEVICE_2' } },
];
