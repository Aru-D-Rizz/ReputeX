import os

for ipath in ['extension/injected/injected.js', 'extension-firefox/injected/injected.js']:
    with open(ipath, 'r', encoding='utf-8') as f:
        text = f.read()

    # Add registerPending definition
    target1 = 'const pendingRequests = new Map();'
    replacement1 = '''const pendingRequests = new Map();

  function registerPending(requestId, entry) {
    entry.timeout = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        console.warn('[ReputeX] Pre-sign simulation timed out (25s), auto-proceeding to wallet.');
        pendingRequests.delete(requestId);
        if (typeof entry.onProceed === 'function') entry.onProceed();
      }
    }, 25000);
    pendingRequests.set(requestId, entry);
  }'''
    text = text.replace(target1, replacement1)

    # Clear timeout in message listener
    target2 = '''    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;

    pendingRequests.delete(data.requestId);'''
    replacement2 = '''    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;

    if (pending.timeout) clearTimeout(pending.timeout);
    pendingRequests.delete(data.requestId);'''
    text = text.replace(target2, replacement2)

    # Replace pendingRequests.set with registerPending
    text = text.replace('pendingRequests.set(requestId,', 'registerPending(requestId,')

    with open(ipath, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'Updated watchdog in {ipath}')
