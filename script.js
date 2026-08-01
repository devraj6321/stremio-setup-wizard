// Simple multi-step wizard state
const state = {
  account: {},
  keys: {},
  regions: {},
  streams: {},
  metadata: {},
  watchly: {},
  subtitles: {},
  packs: {},
};

let currentStep = 1;

function updateStepIndicator() {
  const items = document.querySelectorAll('.step-item');
  items.forEach(item => {
    const step = Number(item.dataset.step);
    item.classList.toggle('active', step === currentStep);
    item.classList.toggle('completed', step < currentStep);
  });
}

function showStep(step) {
  currentStep = step;
  document.querySelectorAll('.wizard-step').forEach(section => {
    const s = Number(section.dataset.step);
    section.hidden = s !== step;
  });
  updateStepIndicator();
  document.getElementById('prevStep').disabled = step === 1;
  document.getElementById('nextStep').textContent = step === 9 ? 'Generate plan' : 'Next';
}

function readStepData(step) {
  switch (step) {
    case 1: {
      state.account.accountMode = document.getElementById('accountMode').value;
      state.account.email = document.getElementById('email').value.trim();
      state.account.password = document.getElementById('password').value.trim();
      state.account.useDuckBackup = document.getElementById('useDuckBackup').checked;
      state.account.useBootstrapper = document.getElementById('useBootstrapper').checked;
      break;
    }
    case 2: {
      const debridServices = Array.from(document.querySelectorAll('input[name="debridService"]:checked')).map(i => i.value);
      state.keys.debridServices = debridServices;
      state.keys.realDebrid = document.getElementById('realDebrid').value.trim();
      state.keys.torBox = document.getElementById('torBox').value.trim();
      state.keys.debridio = document.getElementById('debridio').value.trim();
      state.keys.tmdb = document.getElementById('tmdb').value.trim();
      state.keys.tvdb = document.getElementById('tvdb').value.trim();
      state.keys.rpdb = document.getElementById('rpdb').value.trim();
      break;
    }
    case 3: {
      const regions = Array.from(document.querySelectorAll('input[name="region"]:checked')).map(i => i.value);
      const catalogTypes = Array.from(document.querySelectorAll('input[name="catalogType"]:checked')).map(i => i.value);
      state.regions.catalogRegions = regions;
      state.regions.catalogTypes = catalogTypes;
      break;
    }
    case 4: {
      const profile = document.querySelector('input[name="streamProfile"]:checked');
      const p2p = Array.from(document.querySelectorAll('input[name="p2p"]:checked')).map(i => i.value);
      const http = Array.from(document.querySelectorAll('input[name="http"]:checked')).map(i => i.value);
      const optionalScraper = Array.from(document.querySelectorAll('input[name="optionalScraper"]:checked')).map(i => i.value);
      state.streams.profile = profile ? profile.value : 'debrid';
      state.streams.p2p = p2p;
      state.streams.http = http;
      state.streams.optionalScraper = optionalScraper;
      break;
    }
    case 5: {
      const metadataSources = Array.from(document.querySelectorAll('input[name="metadataSource"]:checked')).map(i => i.value);
      state.metadata.sources = metadataSources;
      state.metadata.removeCinemeta = document.getElementById('removeCinemeta').checked;
      state.metadata.removeCineby = document.getElementById('removeCineby').checked;
      state.metadata.addonPrune = document.getElementById('addonPrune').checked;
      break;
    }
    case 6: {
      state.watchly.useWatchly = document.getElementById('useWatchly').checked;
      state.watchly.continue = document.getElementById('watchlyContinue').checked;
      state.watchly.recommend = document.getElementById('watchlyRecommend').checked;
      state.watchly.useTrakt = document.getElementById('useTrakt').checked;
      state.watchly.enableTraktScrobbling = document.getElementById('enableTraktScrobbling').checked;
      break;
    }
    case 7: {
      const providers = Array.from(document.querySelectorAll('input[name="subtitleProvider"]:checked')).map(i => i.value);
      const langs = Array.from(document.querySelectorAll('input[name="subtitleLang"]:checked')).map(i => i.value);
      state.subtitles.providers = providers;
      state.subtitles.languages = langs;
      break;
    }
    case 8: {
      const packs = Array.from(document.querySelectorAll('input[name="pack"]:checked')).map(i => i.value);
      state.packs.enabled = packs;
      break;
    }
    default:
      break;
  }
}

function validateStep(step) {
  if (step === 2) {
    if (!state.keys.tmdb) {
      alert('TMDB API key is required.');
      return false;
    }
    // If user selected any debrid services, ensure each selected one has a key
    const services = state.keys.debridServices || [];
    if (services.length > 0) {
      const missing = [];
      services.forEach(s => {
        if (s === 'realDebrid' && !state.keys.realDebrid) missing.push('Real-Debrid');
        if (s === 'torBox' && !state.keys.torBox) missing.push('TorBox');
        if (s === 'debridio' && !state.keys.debridio) missing.push('Debridio');
      });
      if (missing.length) {
        alert('Please add API keys for selected debrid services: ' + missing.join(', '));
        return false;
      }
    }
  }
  return true;
}

function buildPlan() {
  const plan = {
    account: state.account,
    keys: state.keys,
    regions: state.regions,
    features: {
      streamProfile: state.streams.profile,
      optionalPacks: state.packs.enabled || [],
      subtitleProviders: state.subtitles.providers || [],
    },
    language: {
      subtitleLanguages: state.subtitles.languages || [],
    },
    addons: {
      coreScrapers: {
        p2p: state.streams.p2p || [],
        http: state.streams.http || [],
        optional: state.streams.optionalScraper || [],
      },
      metadataSources: state.metadata.sources || [],
      catalogsRegions: state.regions.catalogRegions || [],
      catalogTypes: state.regions.catalogTypes || [],
      watchly: state.watchly.useWatchly !== false,
      subtitles: state.subtitles.providers || [],
      optionalPacks: state.packs.enabled || [],
    },
    externalTools: {
      useDuckQuickStart: state.account.accountMode === 'new',
      useDuckBackupTools: state.account.useDuckBackup !== false,
      useBootstrapperPreset: state.account.useBootstrapper ? 'standard' : null,
      runCinemetaPatcher: state.metadata.removeCinemeta !== false,
      runAddonCleanup: state.metadata.addonPrune !== false,
    },
  };

  return plan;
}

function renderPlan(plan) {
  const planJson = document.getElementById('planJson');
  planJson.value = JSON.stringify(plan, null, 2);

  const summary = document.getElementById('planSummary');
  const parts = [];

  // High-level summary
  parts.push('<p><strong>Account:</strong> ' + (plan.account.accountMode === 'new' ? 'New account via Duck / Numb3rs' : 'Existing account') + '</p>');

  if (plan.externalTools.useDuckBackupTools) {
    parts.push('<p>Run Duck Time Machine / Account Cloner to back up your Stremio account before major changes.</p>');
  }

  if (plan.externalTools.useBootstrapperPreset) {
    parts.push('<p>Use Stremio Account Bootstrapper with the "' + plan.externalTools.useBootstrapperPreset + '" preset to install the curated addon bundle.</p>');
  }

  // Debrid & API keys
  parts.push('<p><strong>Debrid services:</strong> ' + ((plan.keys.debridServices || []).join(', ') || 'None (free-only profile possible)') + '</p>');
  parts.push('<p><strong>Metadata keys:</strong> TMDB ' + (plan.keys.tmdb ? '✓' : '✗') + ', TVDB ' + (plan.keys.tvdb ? 'optional' : 'none') + ', RPDB ' + (plan.keys.rpdb ? 'optional' : 'none') + '</p>');

  // Streams
  parts.push('<p><strong>Stream profile:</strong> ' + plan.features.streamProfile + '</p>');
  parts.push('<p><strong>P2P addons:</strong> ' + (plan.addons.coreScrapers.p2p || []).join(', ') + '</p>');
  parts.push('<p><strong>HTTP addons:</strong> ' + (plan.addons.coreScrapers.http || []).join(', ') + '</p>');

  // Metadata & catalogs
  parts.push('<p><strong>Metadata sources:</strong> ' + (plan.addons.metadataSources || []).join(', ') + '</p>');
  parts.push('<p><strong>Catalog regions:</strong> ' + (plan.addons.catalogsRegions || []).join(', ') + '</p>');
  parts.push('<p><strong>Catalog types:</strong> ' + (plan.addons.catalogTypes || []).join(', ') + '</p>');

  // Watchly & Trakt
  if (plan.addons.watchly) {
    parts.push('<p>Install Watchly and connect Trakt; enable "Continue watching" and recommendations catalogs.</p>');
  }

  // Subtitles
  parts.push('<p><strong>Subtitle providers:</strong> ' + (plan.addons.subtitles || []).join(', ') + '</p>');
  parts.push('<p><strong>Subtitle languages:</strong> ' + (plan.language.subtitleLanguages || []).join(', ') + '</p>');

  // Packs
  if ((plan.addons.optionalPacks || []).length) {
    parts.push('<p><strong>Optional packs:</strong> ' + plan.addons.optionalPacks.join(', ') + '</p>');
  }

  // Cleanup
  if (plan.externalTools.runCinemetaPatcher) {
    parts.push('<p>Run Cinemeta Patcher / AIOMetadata cleanup to hide Cinemeta / Cineby catalogs.</p>');
  }
  if (plan.externalTools.runAddonCleanup) {
    parts.push('<p>Use Addon Butler or manual cleanup to remove unused scrapers and QoL addons beyond this plan.</p>');
  }

  summary.innerHTML = parts.join('\n');
}

function onGeneratePlan() {
  const plan = buildPlan();
  renderPlan(plan);
}

function initNav() {
  document.getElementById('prevStep').addEventListener('click', () => {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  });

  document.getElementById('nextStep').addEventListener('click', () => {
    readStepData(currentStep);
    if (!validateStep(currentStep)) return;

    if (currentStep === 9) {
      onGeneratePlan();
    } else {
      showStep(currentStep + 1);
    }
  });

  document.getElementById('copyJson').addEventListener('click', async () => {
    const ta = document.getElementById('planJson');
    ta.select();
    try {
      await navigator.clipboard.writeText(ta.value);
      alert('JSON copied to clipboard.');
    } catch (e) {
      alert('Copy failed; please copy manually.');
    }
  });

  document.getElementById('downloadJson').addEventListener('click', () => {
    const blob = new Blob([document.getElementById('planJson').value || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stremio-setup-plan.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  document.querySelectorAll('.step-item').forEach(item => {
    item.addEventListener('click', () => {
      const step = Number(item.dataset.step);
      readStepData(currentStep);
      showStep(step);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  showStep(1);
  initNav();
});
