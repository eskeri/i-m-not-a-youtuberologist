'use strict';
let channelData = {};
let channelClusters = {};
let burrowsChannelClusters = {};
let semanticRelationships = {};
let burrowsRelationships = {};
let totalChannels = 0;
let dataLoaded = false;
function cheek(id) { return document.getElementById(id); }

const dingleberry = 'im_not_a_fartologist_fart_pad_7c3a9f2e';

function fartician(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
}

function fartCode(str) {
    const memeBytes = new TextEncoder().encode(dingleberry);
    const tootBytes = new TextEncoder().encode(String(str || ''));
    const yomama = new Uint8Array(tootBytes.length);
    for (let i = 0; i < tootBytes.length; i++) {
        yomama[i] = tootBytes[i] ^ memeBytes[i % memeBytes.length];
    }
    let icansmellitfromhere = '';
    for (let i = 0; i < yomama.length; i++) {
        icansmellitfromhere += yomama[i].toString(16).padStart(2, '0');
    }
    return icansmellitfromhere;
}

function fartPass(icansmellitfromhere) {
    if (!icansmellitfromhere || icansmellitfromhere.length % 2 !== 0) return '';
    const memeBytes = new TextEncoder().encode(dingleberry);
    const DINGUSES = new Uint8Array(icansmellitfromhere.length / 2);
    for (let i = 0; i < DINGUSES.length; i++) {
        DINGUSES[i] = parseInt(icansmellitfromhere.substr(i * 2, 2), 16);
    }
    const yomama = new Uint8Array(DINGUSES.length);
    for (let i = 0; i < DINGUSES.length; i++) {
        yomama[i] = DINGUSES[i] ^ memeBytes[i % memeBytes.length];
    }
    return new TextDecoder().decode(yomama);
}

function funniId(id) {
    return typeof id === 'string' && /^[A-Za-z0-9_-]{10,12}$/.test(id);
}

async function buttCheckJson(url, fallback) {
    try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) {
            console.warn('Optional data file missing:', url);
            return fallback;
        }
        return await r.json();
    } catch (e) {
        console.warn('Optional data file failed:', url, e);
        return fallback;
    }
}

async function buttRun(items, limit, handler) {
    let index = 0;
    const workers = [];
    const n = Math.min(limit, items.length);
    for (let w = 0; w < n; w++) {
        workers.push((async function () {
            while (index < items.length) {
                const i = index++;
                await handler(items[i], i);
            }
        })());
    }
    await Promise.all(workers);
}

async function wafflestomp(str) {
    if (!window.crypto || !window.crypto.subtle) { // this is for decrypting the data
        throw new Error('Needs HTTPS or localhost.');
    }
    const memeName = 'im_not_a_fartologist';
    const gobbleygook = new TextEncoder();
    const yomama = await crypto.subtle.digest('SHA-256', gobbleygook.encode(str + memeName));
    const DINGUSES = Array.from(new Uint8Array(yomama));
    return DINGUSES.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

function buttNorm(data) {
    const videos = Array.isArray(data.v) ? data.v.map(function (v) {
        return {
            id: v[0],
            duration: v[1],
            upload_date: String(v[2] == null ? '' : v[2])
        };
    }) : [];
    return {
        channel_id: data.id,
        channel_name: data.name,
        channel_handle: data.handle || '',
        videos: videos
    };
}

async function buttCheckAll() {
    const resultDiv = cheek('result');
    try {
        const manifestResponse = await fetch('data/manifest.json', { cache: 'no-store' });
        if (!manifestResponse.ok) {
            throw new Error('manifest.json is missing. Run a program that can make the manifest first.');
        }
        const manifest = await manifestResponse.json();
        const files = manifest.shards || manifest.channel_files || [];

        const failedFiles = [];
        await buttRun(files, 24, async function (file) {
            try {
                const r = await fetch('data/' + file, { cache: 'no-store' });
                if (!r.ok) { failedFiles.push(file); return; }
                const data = await r.json();
                if (Array.isArray(data.v)) {
                    // legacy single-channel file
                    if (data.id) channelData[data.id] = buttNorm(data);
                } else {
                    // shard bundle: { hashed_id: channel }
                    for (const id in data) {
                        if (data[id] && data[id].id) channelData[id] = buttNorm(data[id]);
                    }
                }
            } catch (e) {
                failedFiles.push(file);
            }
        });

        totalChannels = Object.keys(channelData).length;
        if (totalChannels === 0) {
            throw new Error('No channel metadata files could be loaded.');
        }
        if (failedFiles.length > 0) {
            console.warn('Failed to load ' + failedFiles.length + '/' + files.length + ' channel files');
        }

        dataLoaded = true;
        maximumFart(totalChannels);
        console.log('Loaded ' + totalChannels + ' channels for gameologist');
    } catch (error) {
        console.error('Error loading gameologist data:', error);
        if (resultDiv) {
            resultDiv.innerHTML = 'Error loading data: ' + fartician(error.message);
        }
    }
}

function maximumFart(maxChannels) {
    const range = cheek('distanceRange');
    const number = cheek('distanceValue');
    if (!range || !number) return;

    const max = Math.max(1, maxChannels);
    range.max = max;
    number.max = max;

    let v = parseInt(range.value, 10);
    if (isNaN(v) || v < 1) v = Math.min(10, max);
    if (v > max) v = max;
    range.value = v;
    number.value = v;
}

function buttCheckChannel(input) {
    if (!input) return '';
    const patterns = [
        /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/@([a-zA-Z0-9_.-]+)/,
        /youtube\.com\/c\/([a-zA-Z0-9_.-]+)/,
        /youtube\.com\/user\/([a-zA-Z0-9_.-]+)/,
        /youtu\.be\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    ];
    for (let i = 0; i < patterns.length; i++) {
        const m = input.match(patterns[i]);
        if (m) return m[1];
    }
    return input.trim().replace(/^@/, '');
}

function normalizeName(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, '');
}

async function findButt(input) {
    if (!input) return null;
    const washed = input.trim();
    if (!washed) return null;
    const needleNorm = normalizeName(washed);
    if (!needleNorm) return null;

    try {
        const stomped = await wafflestomp(washed);
        if (channelData[stomped]) return stomped;
    } catch (e) {
        // crypto.subtle unavailable; fall through to handle matching.
    }

    for (const channelId of Object.keys(channelData)) {
        const raw = channelData[channelId].channel_handle;
        if (!raw) continue;
        const opened = fartPass(raw);
        if (opened && normalizeName(opened) === needleNorm) return channelId;
    }
    return null;
}

function findButtVid(vidWomp) {
    if (!vidWomp) return null;
    const wrapped = fartCode(vidWomp);
    for (const channelId of Object.keys(channelData)) {
        const videos = channelData[channelId].videos || [];
        for (let i = 0; i < videos.length; i++) {
            if (videos[i].id === wrapped) return channelId;
        }
    }
    return null;
}

function memeUpDate(uploadDate) {
    if (typeof uploadDate !== 'string' || uploadDate.length !== 8) return null;
    const y = parseInt(uploadDate.substring(0, 4), 10);
    const mo = parseInt(uploadDate.substring(4, 6), 10);
    const d = parseInt(uploadDate.substring(6, 8), 10);
    if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return new Date(y, mo - 1, d);
}

function memeDateIn(str) {
    if (!str) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return new Date(y, mo - 1, d);
}

function checkFarts(options) {
    const errors = [];

    if (options.dateFrom) {
        const fromDate = memeDateIn(options.dateFrom);
        const minDate = new Date(2020, 0, 1);
        if (fromDate && fromDate < minDate) {
            errors.push('No content is available before January 1st, 2020. Please adjust your date filter.');
        }
    }

    if (options.dateTo) {
        const toDate = memeDateIn(options.dateTo);
        const minDate = new Date(2020, 0, 1);
        if (toDate && toDate < minDate) {
            errors.push('No content is available before January 1st, 2020. Please adjust your date filter.');
        }
    }

    const minDuration = 480;
    if (options.durationFrom != null && options.durationFrom < minDuration) {
        errors.push('No content is available under 8 minutes. Please adjust your duration filter.');
    }

    if (options.durationTo != null && options.durationTo < minDuration) {
        errors.push('No content is available under 8 minutes. Please adjust your duration filter.');
    }

    return errors;
}

function siftFarts(videos, options) {
    const fromDate = memeDateIn(options.dateFrom);
    const toDate = memeDateIn(options.dateTo);
    const durationFrom = (options.durationFrom != null) ? options.durationFrom : 0;
    const durationTo = (options.durationTo != null) ? options.durationTo : Infinity;

    return videos.filter(function (video) {
        if (fromDate || toDate) {
            const vDate = memeUpDate(video.upload_date);
            if (!vDate) return false;
            if (fromDate && vDate < fromDate) return false;
            if (toDate && vDate > toDate) return false;
        }
        const dur = Number(video.duration) || 0;
        if (dur < durationFrom || dur > durationTo) return false;
        return true;
    });
}

function memeErrors(errors, resultDiv) {
    if (errors.length === 0) return false;
    const errorDiv = document.createElement('div');
    errorDiv.style.margin = '10px 0';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.color = '#721c24';

    const title = document.createElement('strong');
    title.textContent = 'hey check this owt';
    errorDiv.appendChild(title);

    const ul = document.createElement('ul');
    ul.style.margin = '5px 0 0 20px';
    for (const error of errors) {
        const li = document.createElement('li');
        li.textContent = error;
        ul.appendChild(li);
    }
    errorDiv.appendChild(ul);
    resultDiv.appendChild(errorDiv);
    return true;
}

function clusterButts(channelId, options) {
    const clusters = ((options && options.mappingType === 'style') ||
        (window.gameologistOptions &&
        window.gameologistOptions.mappingType === 'style'))
        ? burrowsChannelClusters : channelClusters;
    const cluster = clusters[channelId];
    if (cluster === null || cluster === undefined) return [];
    const out = [];
    for (const id of Object.keys(clusters)) {
        if (clusters[id] === cluster) out.push(id);
    }
    return out;
}

function buttPile(channelId, options) {
    const excludeSelf = !!options.searchOnlySimilar;

    if (options.randomMode === 'channel') {
        return excludeSelf ? [] : [channelId];
    }

    if (options.randomMode === 'cluster') {
        const inCluster = clusterButts(channelId, options).filter(function (id) {
            if (!channelData[id]) return false;
            return excludeSelf ? id !== channelId : true;
        });
        if (inCluster.length > 0) return inCluster;
        return excludeSelf ? [] : [channelId];
    }

    const rels = (options.mappingType === 'semantic') ? semanticRelationships : burrowsRelationships;
    const similar = Array.isArray(rels[channelId]) ? rels[channelId] : [];
    const distance = options.distance;

    if (distance >= totalChannels) {
        const all = Object.keys(channelData).filter(function (id) {
            return excludeSelf ? id !== channelId : true;
        });
        return all.length > 0 ? all : (excludeSelf ? [] : [channelId]);
    }

    const seen = new Set();
    const picked = [];

    if (!excludeSelf && channelData[channelId]) {
        seen.add(channelId);
        picked.push(channelId);
    }

    for (let i = 0; i < similar.length && picked.length < distance; i++) {
        const id = similar[i][0];
        if (excludeSelf && id === channelId) continue;
        if (channelData[id] && !seen.has(id)) {
            seen.add(id);
            picked.push(id);
        }
    }
    if (picked.length > 0) return picked;

    return excludeSelf ? [] : [channelId];
}

function pickFart(channelIds, options) {
    if (options.contribution === 'equal') {
        const eligible = [];
        for (let i = 0; i < channelIds.length; i++) {
            const channelId = channelIds[i];
            const channel = channelData[channelId];
            if (!channel) continue;
            const videos = (channel.videos || []).map(function (v) {
                return { id: v.id, duration: v.duration, upload_date: v.upload_date, channel_id: channelId };
            });
            const filtered = siftFarts(videos, options);
            if (filtered.length > 0) eligible.push({ videos: filtered });
        }
        if (eligible.length === 0) return null;
        const chosen = eligible[Math.floor(Math.random() * eligible.length)];
        return chosen.videos[Math.floor(Math.random() * chosen.videos.length)];
    }

    const all = [];
    for (let i = 0; i < channelIds.length; i++) {
        const channelId = channelIds[i];
        const channel = channelData[channelId];
        if (!channel) continue;
        const videos = channel.videos || [];
        for (let j = 0; j < videos.length; j++) {
            all.push({
                id: videos[j].id,
                duration: videos[j].duration,
                upload_date: videos[j].upload_date,
                channel_id: channelId
            });
        }
    }
    const filtered = siftFarts(all, options);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
}

const TAIL_SKIP = 30;
const HEAD_SKIP = 10;

function pickTimestamp(duration) {
    const dur = Math.floor(Number(duration) || 0);
    const latestStart = dur - TAIL_SKIP;

    if (latestStart <= HEAD_SKIP) {
        return dur > 0 ? Math.floor(Math.random() * dur) : 0;
    }

    const span = latestStart - HEAD_SKIP;
    return HEAD_SKIP + Math.floor(Math.random() * span);
}

function fartJump(video, resultDiv, notice) {
    const actualGuff = fartPass(video.id);
    if (!funniId(actualGuff)) {
        const p = document.createElement('p');
        p.textContent = 'Error: could not decode the chosen video ID (data may be corrupted).';
        p.style.color = '#721c24';
        resultDiv.appendChild(p);
        return;
    }
    const ts = pickTimestamp(video.duration);
    const url = 'https://www.youtube.com/watch?v=' +
        encodeURIComponent(actualGuff) + '&t=' + ts;

    const linkTarget = (window.gameologistOptions && window.gameologistOptions.linkTarget) || 'new';
    const newTab = linkTarget === 'new';
    const target = newTab ? '_blank' : '_self';

    const p = document.createElement('p');
    p.appendChild(document.createTextNode(newTab ? 'Opening in a new tab: ' : 'Opening in current tab: '));
    const fallback = document.createElement('a');
    fallback.href = url;
    fallback.target = target;
    fallback.rel = newTab ? 'noopener noreferrer' : '';
    fallback.textContent = url;
    p.appendChild(fallback);
    resultDiv.appendChild(p);

    const a = document.createElement('a');
    a.href = url;
    a.target = target;
    a.rel = newTab ? 'noopener noreferrer' : '';
    a.style.display = 'none';
    document.body.appendChild(a);
    try {
        a.click();
    } catch (e) {
        console.warn('Programmatic navigation failed; click the fallback link.', e);
    }
    document.body.removeChild(a);
}

window.gameologistSearch = async function (options) {
    const resultDiv = cheek('result');
    if (!resultDiv) return;

    if (!dataLoaded) {
        resultDiv.textContent = 'Loading data…';
        await buttCheckAll();
        if (!dataLoaded) return;
    }
    const opts = {
        channel: (options && options.channel) ? String(options.channel) : '',
        searchOnlySimilar: !!(options && options.searchOnlySimilar),
        randomMode: (options && options.randomMode === 'distance') ? 'distance' :
            ((options && options.randomMode === 'cluster') ? 'cluster' : 'channel'),
        mappingType: (options && options.mappingType === 'style') ? 'style' : 'semantic',
        distance: parseInt(options && options.distance, 10) || 1,
        contribution: (options && options.contribution === 'unequal') ? 'unequal' : 'equal',
        dateFrom: (options && options.dateFrom) || '',
        dateTo: (options && options.dateTo) || '',
        durationFrom: (options && options.durationFrom != null) ? options.durationFrom : null,
        durationTo: (options && options.durationTo != null) ? options.durationTo : null
    };
    if (opts.distance > totalChannels) opts.distance = totalChannels;
    if (opts.distance < 1) opts.distance = 1;

    const errors = checkFarts(opts);
    resultDiv.innerHTML = '';
    if (memeErrors(errors, resultDiv)) {
        return;
    }

    if (opts.searchOnlySimilar && opts.randomMode === 'channel') {
        const p = document.createElement('p');
        p.textContent = '"Search only similar" cannot be combined with "Get random in channel". ' +
            'Choose "Get random by cluster" or "Get random by distance" instead.';
        p.style.color = '#856404';
        resultDiv.appendChild(p);
        return;
    }

    if (!opts.channel) {
        const candidates = Object.keys(channelData);
        const video = pickFart(candidates, opts);
        if (!video) {
            const p = document.createElement('p');
            p.textContent = 'No videos match the current filters.';
            resultDiv.appendChild(p);
            return;
        }
        fartJump(video, resultDiv, '');
        return;
    }

    const cleaned = buttCheckChannel(opts.channel);
    let channelId = await findButt(cleaned);

    if (!channelId) {
        channelId = findButtVid(cleaned);
    }

    if (!channelId) {
        resultDiv.textContent = 'Channel not found. Please check the handle or channel ID (display names are not searched).';
        return;
    }

    const channelName = fartPass(channelData[channelId].channel_name) || '(unknown channel)';
    const channelHandle = fartPass(channelData[channelId].channel_handle) || '';

    if (opts.randomMode !== 'channel') {
        if (Object.keys(semanticRelationships).length === 0 ||
            Object.keys(burrowsRelationships).length === 0 ||
            Object.keys(burrowsChannelClusters).length === 0 ||
            Object.keys(channelClusters).length === 0) {
            await Promise.all([
                (async () => { semanticRelationships  = await buttCheckJson('data/semantic_relationships.json', {}); })(),
                (async () => { burrowsRelationships   = await buttCheckJson('data/burrows_relationships.json', {}); })(),
                (async () => { burrowsChannelClusters = await buttCheckJson('data/burrows_channel_clusters.json', {}); })(),
                (async () => { channelClusters        = await buttCheckJson('data/channel_clusters.json', {}); })(),
            ]);
        }
    }

    const primaryRels = (opts.mappingType === 'semantic') ? semanticRelationships : burrowsRelationships;
    const hasPrimary = Array.isArray(primaryRels[channelId]) && primaryRels[channelId].length > 0;
    let notice = '';

    const displayLabel = channelHandle ? ('@' + channelHandle) : channelName;

    if (opts.randomMode === 'distance' && !hasPrimary && !opts.searchOnlySimilar) {
        notice = 'Channel "' + displayLabel + '" has no ' + opts.mappingType +
            ' relationships available. Falling back to the channel itself.';
    } else if (opts.randomMode === 'cluster' && !opts.searchOnlySimilar) {
        const clusterMap = (opts.mappingType === 'style') ? burrowsChannelClusters : channelClusters;
        if (!(channelId in clusterMap)) {
            notice = 'Channel "' + displayLabel + '" has no ' + opts.mappingType +
                ' cluster. Falling back to the channel itself.';
        }
    }

    const candidates = buttPile(channelId, opts);

    if (candidates.length === 0) {
        const p = document.createElement('p');
        if (opts.searchOnlySimilar) {
            if (opts.randomMode === 'cluster') {
                p.textContent = 'Channel "' + displayLabel + '" has no other channels in its ' +
                    opts.mappingType + ' cluster. Try "Get random by distance" or turn off ' +
                    '"Search only similar".';
            } else {
                p.textContent = 'No similar channels available for "' + displayLabel + '" in ' +
                    opts.mappingType + ' mapping. Try a different mapping type or turn off ' +
                    '"Search only similar".';
            }
        } else {
            p.textContent = 'No candidate channels available for "' + displayLabel + '".';
        }
        p.style.color = '#856404';
        resultDiv.appendChild(p);
        return;
    }

    if (notice) {
        console.warn(notice);
        const p = document.createElement('p');
        p.textContent = notice;
        p.style.color = '#856404';
        resultDiv.appendChild(p);
    }

    const video = pickFart(candidates, opts);
    if (!video) {
        const p = document.createElement('p');
        p.textContent = 'No videos match the current filters.';
        resultDiv.appendChild(p);
        return;
    }

    fartJump(video, resultDiv, notice);
};

(function () {
    'use strict';

    var cheek = function (id) { return document.getElementById(id); };

    var state = {
        channel: '',
        searchOnlySimilar: false,
        randomMode: 'channel',
        mappingType: 'semantic',
        distance: 10,
        contribution: 'equal',
        dateFrom: '2020-01-01',
        dateTo: '',
        durationFrom: null,
        durationTo: null,
        linkTarget: 'new'
    };
    window.gameologistOptions = state;

    function fartSignal() {
        if (typeof window.gameologistOnOptionsChange === 'function') {
            window.gameologistOnOptionsChange(state);
        }
    }

    function womp(button, pressed) {
        button.setAttribute('aria-pressed', String(pressed));
        button.style.fontWeight = pressed ? 'bold' : '';
        button.style.boxShadow = pressed ? 'inset 0 0 0 2px currentColor' : '';
    }

    function cheekCheck() {
        const hasChannel = cheek('channelInput').value.trim() !== '';
        const allowSimilarOnly = hasChannel && state.randomMode !== 'channel';
        cheek('searchOnlySimilar').disabled = !allowSimilarOnly;
        cheek('randomByCluster').disabled = !hasChannel;
        cheek('randomByDistance').disabled = !hasChannel;
        cheek('randomInChannel').disabled = !hasChannel;
        cheek('semantic').disabled = !hasChannel;
        cheek('style').disabled = !hasChannel;
        if (!allowSimilarOnly && state.searchOnlySimilar) {
            state.searchOnlySimilar = false;
            cheek('searchOnlySimilar').checked = false;
            fartSignal();
        }
    }

    window.funniMode = function (mode) {
        if (mode !== 'cluster' && mode !== 'distance' && mode !== 'channel') { return; }
        state.randomMode = mode;
        cheek('distanceOptions').style.display = (mode === 'distance') ? 'block' : 'none';
        if (mode === 'distance') { tootRange(cheek('distanceRange').value); }
        memeBtns();
        cheekCheck();
        fartSignal();
    };

    function memeBtns() {
        womp(cheek('randomByCluster'), state.randomMode === 'cluster');
        womp(cheek('randomByDistance'), state.randomMode === 'distance');
        womp(cheek('randomInChannel'), state.randomMode === 'channel');
        womp(cheek('semantic'), state.mappingType === 'semantic');
        womp(cheek('style'), state.mappingType === 'style');
    }

    window.buttToggle = function () {
        var box = cheek('optionsBox');
        var hidden = getComputedStyle(box).display === 'none';
        box.style.display = hidden ? 'block' : 'none';
        cheek('optionsButton').textContent = hidden ? 'Hide options' : 'Options';
        cheek('optionsButton').setAttribute('aria-expanded', String(hidden));
    };

    window.memeMap = function (type) {
        if (type !== 'semantic' && type !== 'style') { return; }
        state.mappingType = type;
        memeBtns();
        cheekCheck();
        fartSignal();
    };

    function tootRange(value, keepFieldValue) {
        var v = parseInt(value, 10);
        if (isNaN(v)) { v = 10; }
        var min = parseInt(cheek('distanceRange').min, 10) || 1;
        var max = parseInt(cheek('distanceRange').max, 10) || 100;
        v = Math.min(max, Math.max(min, v));
        state.distance = v;
        cheek('distanceRange').value = v;
        if (keepFieldValue !== true) { cheek('distanceValue').value = v; }
    }

    window.tootVal = function () {
        tootRange(cheek('distanceRange').value);
        fartSignal();
    };

    function buttCheckUI() {
        state.channel = cheek('channelInput').value.trim();
        state.searchOnlySimilar = cheek('searchOnlySimilar').checked;
        state.distance = parseInt(cheek('distanceRange').value, 10) || 1;
        var contribution = document.querySelector('input[name="contribution"]:checked');
        state.contribution = contribution ? contribution.value : 'equal';
        var linkTargetRadio = document.querySelector('input[name="linkTarget"]:checked');
        state.linkTarget = linkTargetRadio ? linkTargetRadio.value : 'new';
        state.dateFrom = cheek('dateFrom').value;
        state.dateTo = cheek('dateTo').value;
        state.durationFrom = memeTime(cheek('durationFrom').value);
        state.durationTo = memeTime(cheek('durationTo').value);
    }

    window.letRip = function () {
        buttCheckUI();

        if (typeof window.gameologistSearch === 'function') {
            window.gameologistSearch(state);
            return;
        }

        fartMsg(
            state.channel ? 'Searching for "' + state.channel + '"…' : 'Getting a random video…',
            JSON.stringify(state, null, 2)
        );
    };

    function fartMsg(text, detail) {
        var result = cheek('result');
        result.innerHTML = '';

        var p = document.createElement('p');
        p.textContent = text;
        result.appendChild(p);

        if (detail) {
            var pre = document.createElement('pre');
            pre.textContent = detail;
            result.appendChild(pre);
        }
    }

    function memeTime(durationStr) {
        if (!durationStr) { return null; }

        var parts = durationStr.split(':');
        if (parts.length < 1 || parts.length > 3) { return null; }

        var nums = [];
        for (var i = 0; i < parts.length; i++) {
            var raw = parts[i].trim();
            if (raw === '') { return null; }
            var n = Number(raw);
            if (isNaN(n) || n < 0 || Math.floor(n) !== n) { return null; }
            nums.push(n);
        }

        if (nums.length === 3) { return nums[0] * 3600 + nums[1] * 60 + nums[2]; }
        if (nums.length === 2) { return nums[0] * 60 + nums[1]; }
        return nums[0];
    }

    function buttCheckTime(input, stateKey) {
        var parsed = memeTime(input.value);
        state[stateKey] = parsed;
        input.setAttribute('aria-invalid', String(input.value !== '' && parsed === null));
        fartSignal();
    }

    cheek('goButton').addEventListener('click', function () { window.letRip(); });
    cheek('optionsButton').addEventListener('click', function () { window.buttToggle(); });

    cheek('randomByCluster').addEventListener('click', function () { window.funniMode('cluster'); });
    cheek('randomByDistance').addEventListener('click', function () { window.funniMode('distance'); });
    cheek('randomInChannel').addEventListener('click', function () { window.funniMode('channel'); });

    cheek('semantic').addEventListener('click', function () { window.memeMap('semantic'); });
    cheek('style').addEventListener('click', function () { window.memeMap('style'); });

    cheek('distanceRange').addEventListener('input', window.tootVal);
    cheek('distanceValue').addEventListener('input', function () {
        var v = parseInt(this.value, 10);
        if (isNaN(v)) { return; }
        tootRange(v, true);
        fartSignal();
    });
    cheek('distanceValue').addEventListener('change', function () {
        tootRange(this.value);
        fartSignal();
    });

    cheek('channelInput').addEventListener('input', function () {
        state.channel = this.value.trim();
        if (!state.channel) {
            state.searchOnlySimilar = false;
            cheek('searchOnlySimilar').checked = false;
        }
        cheekCheck();
    });
    cheek('channelInput').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.letRip();
        }
    });

    cheek('searchOnlySimilar').addEventListener('change', function () {
        state.searchOnlySimilar = this.checked;
        fartSignal();
    });

    Array.prototype.forEach.call(
        document.querySelectorAll('input[name="contribution"]'),
        function (radio) {
            radio.addEventListener('change', function () {
                if (this.checked) {
                    state.contribution = this.value;
                    fartSignal();
                }
            });
        }
    );

    Array.prototype.forEach.call(
        document.querySelectorAll('input[name="linkTarget"]'),
        function (radio) {
            radio.addEventListener('change', function () {
                if (this.checked) {
                    state.linkTarget = this.value;
                    fartSignal();
                }
            });
        }
    );

    cheek('dateFrom').addEventListener('change', function () { state.dateFrom = this.value; fartSignal(); });
    cheek('dateTo').addEventListener('change', function () { state.dateTo = this.value; fartSignal(); });
    cheek('durationFrom').addEventListener('input', function () { buttCheckTime(this, 'durationFrom'); });
    cheek('durationTo').addEventListener('input', function () { buttCheckTime(this, 'durationTo'); });
    cheek('commonSettings').addEventListener('click', function () {
        cheek('searchOnlySimilar').checked = false;
        cheek('channelInput').value = 'Ctop';
        cheek('dateFrom').value = '2023-01-01';
        cheek('dateTo').value = '';
        cheek('durationFrom').value = '';
        cheek('durationTo').value = '43:00';
        window.funniMode('channel');
        buttCheckUI();
        cheekCheck();
        memeBtns();
        fartSignal();
    });
    cheek('commonSettings2').addEventListener('click', function () {
        cheek('searchOnlySimilar').checked = false;
        cheek('channelInput').value = 'Nivarias';
        cheek('dateFrom').value = '2023-01-01';
        cheek('dateTo').value = '';
        cheek('durationFrom').value = '10:00';
        cheek('durationTo').value = '1:30:00';
        window.funniMode('distance');
        window.memeMap('semantic');
        tootRange('60');
        buttCheckUI();
        cheekCheck();
        memeBtns();
        fartSignal();
    });
    cheek('commonSettings3').addEventListener('click', function () {
        cheek('searchOnlySimilar').checked = false;
        cheek('channelInput').value = 'wanderbots';
        cheek('dateFrom').value = '2025-01-01';
        cheek('dateTo').value = '';
        cheek('durationFrom').value = '10:00';
        cheek('durationTo').value = '';
        window.funniMode('cluster');
        window.memeMap('semantic');
        buttCheckUI();
        cheekCheck();
        memeBtns();
        fartSignal();
    });
    cheek('commonSettings4').addEventListener('click', function () {
        cheek('searchOnlySimilar').checked = false;
        cheek('channelInput').value = 'Neilogical';
        cheek('dateFrom').value = '2024-01-01';
        cheek('dateTo').value = '';
        cheek('durationFrom').value = '12:00';
        cheek('durationTo').value = '';
        window.funniMode('distance');
        window.memeMap('semantic');
        tootRange('50');
        buttCheckUI();
        cheekCheck();
        memeBtns();
        fartSignal();
    });
    cheek('commonSettings5').addEventListener('click', function () {
        cheek('searchOnlySimilar').checked = false;
        cheek('channelInput').value = 'PanzerPaw';
        cheek('dateFrom').value = '2024-01-01';
        cheek('dateTo').value = '';
        cheek('durationFrom').value = '12:00';
        cheek('durationTo').value = '';
        window.funniMode('cluster');
        window.memeMap('semantic');
        buttCheckUI();
        cheekCheck();
        memeBtns();
        fartSignal();
    });
    cheek('commonSettings6').addEventListener('click', function () {
        cheek('searchOnlySimilar').checked = false;
        cheek('channelInput').value = 'ReggieGames';
        cheek('dateFrom').value = '2023-01-01';
        cheek('dateTo').value = '';
        cheek('durationFrom').value = '15:00';
        cheek('durationTo').value = '';
        window.funniMode('distance');
        window.memeMap('style');
        tootRange('30');
        buttCheckUI();
        cheekCheck();
        memeBtns();
        fartSignal();
    });

    state.channel = cheek('channelInput').value.trim();
    state.searchOnlySimilar = cheek('searchOnlySimilar').checked;
    var initialContribution = document.querySelector('input[name="contribution"]:checked');
    state.contribution = initialContribution ? initialContribution.value : 'equal';
    var initialLinkTarget = document.querySelector('input[name="linkTarget"]:checked');
    state.linkTarget = initialLinkTarget ? initialLinkTarget.value : 'new';
    state.dateFrom = cheek('dateFrom').value;
    state.dateTo = cheek('dateTo').value;
    state.durationFrom = memeTime(cheek('durationFrom').value);
    state.durationTo = memeTime(cheek('durationTo').value);

    tootRange(state.distance);
    memeBtns();
    cheekCheck();

    console.log('Gameologist loaded');
    buttCheckAll();
})();