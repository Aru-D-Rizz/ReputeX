import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if 'MALICIOUS DRAINER DETECTED' in line and not line.strip().startswith('//'):
            if 'service_worker.js' in filepath:
                new_lines.append("        message: '🚨 MALICIOUS DRAINER DETECTED: Bytecode/calldata references flagged scam address (' + drainer.addr + ') [' + drainer.label + ']!'\n")
            else:
                new_lines.append("        message: '🚨 MALICIOUS DRAINER DETECTED: Transaction references flagged scam address (' + scamAddr + ') associated with ' + (info.details || info.type) + '!'\n")
        elif 'Payable Deployment' in line and not line.strip().startswith('//'):
            new_lines.append("        message: '⚠️ Payable Deployment: Sending ' + valueETH.toFixed(4) + ' ETH to newly created unverified contract.'\n")
        else:
            new_lines.append(line)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f'Fixed {filepath}')

fix_file('backend/engine/simulationEngine.js')
fix_file('extension/background/service_worker.js')
fix_file('extension-firefox/background/service_worker.js')
