import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # Set slide dimensions to 16:9 widescreen (13.333 x 7.5 inches)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Color Palette (Dark Obsidian & Gold / Emerald / Slate Theme - NO BLUE/PURPLE GRADIENTS)
    BG_COLOR = RGBColor(11, 15, 23)       # Dark Obsidian (#0B0F17)
    CARD_BG = RGBColor(22, 31, 46)        # Dark Slate Card (#161F2E)
    CARD_BORDER = RGBColor(51, 65, 85)    # Slate Border (#334155)
    
    TEXT_MAIN = RGBColor(248, 250, 252)   # Off-White (#F8FAFC)
    TEXT_MUTED = RGBColor(148, 163, 184) # Muted Slate (#94A3B8)
    
    GOLD = RGBColor(245, 158, 11)         # Gold / Amber (#F59E0B)
    EMERALD = RGBColor(16, 185, 129)      # Emerald Green (#10B981)
    TEAL = RGBColor(20, 184, 166)         # Teal (#14B8A6)
    RED = RGBColor(239, 68, 68)           # Red (#EF4444)
    CARD_BG_ALT = RGBColor(30, 41, 59)    # Lighter Slate (#1E293B)

    def set_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="REPUTEX PRESENTATION"):
        # Header Banner / Category Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = GOLD
        p_cat.font.name = "Calibri"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_MAIN
        p_title.font.name = "Calibri"

        # Divider line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = GOLD
        line.line.fill.background()

    def add_footer(slide, current_page, total_pages=14):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.3))
        tf = footer_box.text_frame
        p = tf.paragraphs[0]
        p.text = f"ReputeX v2.1.0 | Web3 Explainable AI Security | Slide {current_page} of {total_pages}"
        p.font.size = Pt(9)
        p.font.color.rgb = TEXT_MUTED
        p.font.name = "Calibri"

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
        return card

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide1)

    # Hero Card Container
    add_card(slide1, Inches(1.0), Inches(1.2), Inches(11.333), Inches(5.1), bg_color=CARD_BG, border_color=GOLD)

    # Main Title
    t_box = slide1.shapes.add_textbox(Inches(1.4), Inches(1.6), Inches(10.5), Inches(1.5))
    tf1 = t_box.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "REPUTEX"
    p1.font.size = Pt(54)
    p1.font.bold = True
    p1.font.color.rgb = GOLD
    p1.font.name = "Calibri"

    p2 = tf1.add_paragraph()
    p2.text = "Multi-Chain Web3 Wallet Reputation & Explainable AI (XAI) Security Platform"
    p2.font.size = Pt(22)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_MAIN
    p2.font.name = "Calibri"

    # Subtitle / Description Box
    d_box = slide1.shapes.add_textbox(Inches(1.4), Inches(3.2), Inches(10.5), Inches(1.8))
    tf_d = d_box.text_frame
    tf_d.word_wrap = True
    
    bullets = [
        "⚡ Automated Inline DOM Scanning across 6 Major Blockchains (EVM, BTC, SOL, ADA, DOT, XRP) & ENS Domains",
        "🧠 Continuous Mathematical Scoring Engine (0-100) with SHA-256 Cryptographic Micro-Entropy Dispersion",
        "🤖 Nvidia Nemotron 3.5 Lightning AI Assistant for Plain-English On-Chain Risk Synthesis & Interactive Q&A",
        "🛡️ Real-Time Etherscan ABI Smart Contract Audit & Supabase Community Threat Intelligence Reporting",
        "🌐 Manifest V3 Extension for Chrome, Edge, Firefox, Opera, Brave & Firefox Android"
    ]
    for b in bullets:
        p = tf_d.add_paragraph()
        p.text = b
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_MUTED
        p.font.name = "Calibri"
        p.space_after = Pt(4)

    # Footer Metadata
    meta_box = slide1.shapes.add_textbox(Inches(1.4), Inches(5.4), Inches(10.5), Inches(0.5))
    tf_m = meta_box.text_frame
    p_m = tf_m.paragraphs[0]
    p_m.text = "VERSION 2.1.0  |  PRODUCT SHOWCASE & LAUNCH PRESENTATION  |  OPEN-SOURCE WEB3 SECURITY"
    p_m.font.size = Pt(11)
    p_m.font.bold = True
    p_m.font.color.rgb = EMERALD

    add_footer(slide1, 1)

    # ==========================================
    # SLIDE 2: Executive Summary & Problem Statement
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide2)
    add_header(slide2, "EXECUTIVE SUMMARY: THE WEB3 TRUST CRISIS", "PROBLEM & SOLUTION OVERVIEW")

    # Left Box - The Problem
    add_card(slide2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9), bg_color=CARD_BG, border_color=RED)
    tb_p = slide2.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_p = tb_p.text_frame
    tf_p.word_wrap = True
    
    p = tf_p.paragraphs[0]
    p.text = "🚨 The Problem: Broken Web3 Trust"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = RED

    prob_text = [
        "• Billions Lost Annually: Phishing, rug pulls, unverified contract drainers, and malicious addresses cause massive user losses.",
        "• High Friction & Tab Fatigue: Users must manually copy addresses, open Etherscan/Solscan, paste, and search for every single address.",
        "• Uninterpretable Raw Logs: Block explorers show raw hex code, bytecode, and transaction traces that 99% of users cannot interpret.",
        "• Social Media Blindspots: Addresses shared on Twitter/X, OpenSea, Discord, and DexScreener have zero inline safety context.",
        "• Static / Coarse Scoring: Legacy security tools rely on static blacklists or coarse step scores that produce identical generic ratings."
    ]
    for pt in prob_text:
        p = tf_p.add_paragraph()
        p.text = pt
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(6)

    # Right Box - The ReputeX Solution
    add_card(slide2, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9), bg_color=CARD_BG, border_color=EMERALD)
    tb_s = slide2.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True
    
    p = tf_s.paragraphs[0]
    p.text = "⚡ The Solution: ReputeX AI Security"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = EMERALD

    sol_text = [
        "• Zero-Friction Inline Scanning: Automatically parses every text node on any webpage and replaces raw addresses with colored risk badges.",
        "• Continuous Math Scoring: Evaluates wallet age, tx frequency, volume, balances, and counterparties via continuous logarithmic curves.",
        "• Nvidia Nemotron AI Synthesis: Converts complex raw blockchain logs into clear, plain-English security summaries and interactive Q&A.",
        "• Community Threat Network: Integrated with Supabase PostgreSQL to crowdsource and flag phishing reports in real time.",
        "• 30x–100x Efficiency Boost: Eliminates copy-pasting entirely. Evaluates all page addresses simultaneously in under 3 seconds."
    ]
    for st in sol_text:
        p = tf_s.add_paragraph()
        p.text = st
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(6)

    add_footer(slide2, 2)

    # ==========================================
    # SLIDE 3: Multi-Chain Address Detection
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide3)
    add_header(slide3, "AUTOMATIC MULTI-CHAIN ADDRESS DETECTION & HIGHLIGHTING", "CORE ENGINE ENGINE DESIGN")

    # Description top box
    add_card(slide3, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.1), bg_color=CARD_BG_ALT, border_color=GOLD)
    tb_m = slide3.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.3), Inches(0.9))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True
    p = tf_m.paragraphs[0]
    p.text = "⚡ High-Performance DOM Parsing & SPA Mutation Observer"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = GOLD
    
    p2 = tf_m.add_paragraph()
    p2.text = "ReputeX runs an isolated, read-only DOM TreeWalker that safely parses text nodes without injecting unverified code. A debounced MutationObserver dynamically detects newly loaded addresses on Twitter/X, Etherscan, OpenSea, GitHub, and DexScreener."
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_MAIN

    # Table of Supported Blockchains
    rows, cols = 7, 4
    left, top, width, height = Inches(0.8), Inches(3.1), Inches(11.733), Inches(3.6)
    table_shape = slide3.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(1.8)
    table.columns[2].width = Inches(4.5)
    table.columns[3].width = Inches(3.233)

    headers = ["Blockchain / Protocol", "Badge Indicator", "Address Regex Pattern & Validation Format", "Supported Address Types"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG_ALT
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = GOLD

    chain_data = [
        ("Ethereum & EVM", "Blue (ETH)", "0x[a-fA-F0-9]{40} (Checksum Validated)", "ETH, BSC, Polygon, Arbitrum, Optimism"),
        ("Bitcoin", "Gold (BTC)", "^(1|3|bc1q|bc1p)[a-zA-HJ-NP-Z0-9]{25,62}$", "Legacy P2PKH, P2SH, SegWit, Taproot"),
        ("Solana", "Purple (SOL)", "^[1-9A-HJ-NP-Za-km-z]{32,44}$", "Base58 Public Keys & Token Accounts"),
        ("Cardano", "Cyan (ADA)", "^addr(_test)?1[a-z0-9]{50,100}$", "Shelley Bech32 Mainnet & Testnet"),
        ("Polkadot", "Pink (DOT)", "^1[0-9a-zA-Z]{47,48}$", "SS58 Substrate Relay Chain"),
        ("XRP Ledger", "Green (XRP)", "^r[0-9a-zA-Z]{24,34}$", "Ripple Base58 Account Addresses")
    ]

    for row_idx, data in enumerate(chain_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_MAIN if col_idx != 1 else GOLD

    add_footer(slide3, 3)

    # ==========================================
    # SLIDE 4: XAI Continuous Scoring Engine
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide4)
    add_header(slide4, "EXPLAINABLE AI (XAI) CONTINUOUS SCORING ENGINE", "DETERMINISTIC MULTI-FACTOR ALGORITHM")

    # Left Side: Mathematical Formulas Card
    add_card(slide4, Inches(0.8), Inches(1.8), Inches(6.5), Inches(4.9), bg_color=CARD_BG, border_color=GOLD)
    tb_f = slide4.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(6.1), Inches(4.6))
    tf_f = tb_f.text_frame
    tf_f.word_wrap = True

    p = tf_f.paragraphs[0]
    p.text = "🧮 Continuous Mathematical Curves (No Step Functions)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = GOLD

    formulas = [
        "1. Wallet Age (Max 15 pts):\n   Score = √(ageDays / 1825) × 15",
        "2. Transaction Count (Max 14 pts):\n   Score = [ln(1 + txCount) / ln(1 + 5000)] × 14",
        "3. USD Transaction Volume (Max 10 pts):\n   Score = [log₁₀(1 + volumeUSD) / 6] × 10",
        "4. Live USD Balance (Max 6 pts):\n   Score = [log₁₀(1 + balanceUSD) / 4.5] × 6",
        "5. Counterparty Diversity (Max 8 pts):\n   Score = (uniquePeers)^0.36 × 1.5",
        "6. Smart Contract Verification: Verified (+12 pts), Unverified (-20 pts)",
        "7. Cryptographic Micro-Entropy: SHA-256 dispersion (±2.0 pts micro-variance)"
    ]

    for fmt in formulas:
        p = tf_f.add_paragraph()
        p.text = fmt
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(4)

    # Right Side: Risk Tiers Card
    add_card(slide4, Inches(7.6), Inches(1.8), Inches(4.933), Inches(4.9), bg_color=CARD_BG, border_color=TEAL)
    tb_t = slide4.shapes.add_textbox(Inches(7.8), Inches(1.9), Inches(4.5), Inches(4.6))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True

    p = tf_t.paragraphs[0]
    p.text = "📊 4-Tier Risk Classification"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = TEAL

    tiers = [
        ("🟢 LOW RISK / TRUSTED (80 - 100)", EMERALD, "Established wallet age, high transaction volume, verified contract code, zero malicious counterparty flags."),
        ("🟡 CAUTION / MEDIUM RISK (55 - 79)", GOLD, "Moderate on-chain history, neutral counterparty graph, new or dormant address with no active flags."),
        ("🟠 HIGH RISK (30 - 54)", GOLD, "Unverified smart contract bytecode, rapid fund velocity, or 2-hop proximity to flagged entities."),
        ("🔴 CRITICAL RISK (0 - 29)", RED, "Direct interaction with Tornado Cash, wallet drainers, phishing registries, or community threat reports.")
    ]

    for title, color, desc in tiers:
        p = tf_t.add_paragraph()
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_before = Pt(8)

        p_d = tf_t.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MUTED

    add_footer(slide4, 4)

    # ==========================================
    # SLIDE 5: Nvidia Nemotron AI Security Consultant
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide5)
    add_header(slide5, "NVIDIA NEMOTRON AI SECURITY CONSULTANT", "CONVERSATIONAL ON-CHAIN INTELLIGENCE")

    # Left: AI Architecture Card
    add_card(slide5, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9), bg_color=CARD_BG, border_color=GOLD)
    tb_ai = slide5.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.2), Inches(4.6))
    tf_ai = tb_ai.text_frame
    tf_ai.word_wrap = True

    p = tf_ai.paragraphs[0]
    p.text = "🤖 OpenRouter Multi-Model Gateway"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = GOLD

    ai_details = [
        "• Primary Model: nvidia/nemotron-3.5-lightning:free",
        "• Low Latency: Optimized for ultra-fast response generation in under 800ms.",
        "• Cascading Fallback Network:\n  1. Google Gemma 2 9B IT\n  2. Qwen 2.5 72B Instruct\n  3. Meta Llama 3.3 70B Instruct\n  4. Nvidia Nemotron 3 Ultra 550B",
        "• High Reliability: Ensures 99.9% uptime for AI responses even under heavy API load.",
        "• Zero Data Retention: User queries and wallet context are evaluated ephemerally without logging."
    ]

    for text in ai_details:
        p = tf_ai.add_paragraph()
        p.text = text
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(8)

    # Right: AI Capabilities & Interface Card
    add_card(slide5, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9), bg_color=CARD_BG, border_color=EMERALD)
    tb_cap = slide5.shapes.add_textbox(Inches(7.0), Inches(1.9), Inches(5.3), Inches(4.6))
    tf_cap = tb_cap.text_frame
    tf_cap.word_wrap = True

    p = tf_cap.paragraphs[0]
    p.text = "💡 Interactive Security Capabilities"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = EMERALD

    caps = [
        "1. Plain-English Risk Synthesis:\n   Converts raw transaction counts, volume data, and contract bytecode status into clear natural language recommendations.",
        "2. Interactive Contextual Q&A:\n   Users can ask natural questions directly inside the popup or hover card (e.g., 'Is this address safe for staking?', 'Why is this flagged?').",
        "3. Preset Quick Chips:\n   One-click prompt buttons for instant security audits: ['Is it safe?', 'Why suspicious?', 'Risky connections?'].",
        "4. Entity Type Likelihood Classifier:\n   Predicts likelihood percentages across entity categories: Personal, Exchange, Merchant, Whale, Bot, Mixer, Scam."
    ]

    for c in caps:
        p = tf_cap.add_paragraph()
        p.text = c
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(8)

    add_footer(slide5, 5)

    # ==========================================
    # SLIDE 6: Smart Contract Verification & Etherscan ABI
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide6)
    add_header(slide6, "SMART CONTRACT AUDIT & ETHERSCAN ABI VERIFICATION", "REAL-TIME CODE ANALYSIS")

    # 3 Cards Layout
    card_width = Inches(3.64)
    gap = Inches(0.4)

    # Card 1: Real-Time ABI Query
    add_card(slide6, Inches(0.8), Inches(1.8), card_width, Inches(4.9), bg_color=CARD_BG, border_color=GOLD)
    tb1 = slide6.shapes.add_textbox(Inches(0.95), Inches(1.95), card_width - Inches(0.3), Inches(4.5))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    p.text = "🔍 Live Etherscan ABI Audit"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = GOLD

    c1_txt = [
        "• Automatic Contract Identification: Detects whether an EVM address is an EOA (Externally Owned Account) or a Smart Contract.",
        "• Real-Time Source Code Fetch: Queries Etherscan API to verify whether source code has been published and audited.",
        "• Bytecode Hash Matching: Validates compiled bytecode against published source code."
    ]
    for txt in c1_txt:
        p = tf1.add_paragraph()
        p.text = txt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(8)

    # Card 2: Verified Code Boost (+12)
    add_card(slide6, Inches(0.8) + card_width + gap, Inches(1.8), card_width, Inches(4.9), bg_color=CARD_BG, border_color=EMERALD)
    tb2 = slide6.shapes.add_textbox(Inches(0.95) + card_width + gap, Inches(1.95), card_width - Inches(0.3), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    
    p = tf2.paragraphs[0]
    p.text = "✅ Verified Source (+12 Boost)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = EMERALD

    c2_txt = [
        "• Open-Source Auditable Code: Verified smart contracts earn an immediate +12 trust score bonus.",
        "• Public Function Signatures: Enables analysis of contract functions (mint, burn, transfer, pause).",
        "• Protocol Legitimacy Signal: High assurance for established dApps (Uniswap, Aave, Curve)."
    ]
    for txt in c2_txt:
        p = tf2.add_paragraph()
        p.text = txt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(8)

    # Card 3: Unverified Code Penalty (-20)
    add_card(slide6, Inches(0.8) + (card_width + gap)*2, Inches(1.8), card_width, Inches(4.9), bg_color=CARD_BG, border_color=RED)
    tb3 = slide6.shapes.add_textbox(Inches(0.95) + (card_width + gap)*2, Inches(1.95), card_width - Inches(0.3), Inches(4.5))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    
    p = tf3.paragraphs[0]
    p.text = "🚨 Unverified Warning (-20 Penalty)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = RED

    c3_txt = [
        "• Closed-Source Risk Flag: Unverified contracts trigger an immediate -20 risk penalty and red warning banner.",
        "• Protection Against Drainers: Prevents interaction with unverified wallet drainer contracts and honeypots.",
        "• High Risk Notification: Prominently displayed in both extension popup and webpage hover card."
    ]
    for txt in c3_txt:
        p = tf3.add_paragraph()
        p.text = txt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(8)

    add_footer(slide6, 6)

    # ==========================================
    # SLIDE 7: Supabase Threat Intelligence & Reporting
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide7)
    add_header(slide7, "SUPABASE CLOUD DB & COMMUNITY THREAT REPORTING", "CROWDSOURCED THREAT INTELLIGENCE")

    # Left: Database Architecture Card
    add_card(slide7, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9), bg_color=CARD_BG, border_color=GOLD)
    tb_db = slide7.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.2), Inches(4.6))
    tf_db = tb_db.text_frame
    tf_db.word_wrap = True

    p = tf_db.paragraphs[0]
    p.text = "🗄️ Supabase PostgreSQL Backend"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = GOLD

    db_txt = [
        "• High-Performance Cloud Database: Managed PostgreSQL database running on Supabase infrastructure.",
        "• Connection Pooling (`pg.Pool`): Configured with Supabase transaction pooler for low-latency serverless execution.",
        "• Schema Structure:\n  - `public.reports`: Address, threat type, description, submitter client ID, timestamp.\n  - `public.watchlists`: Saved addresses for user monitoring.",
        "• Direct Integration: Backend query pipeline checks Supabase threat reports on every reputation scan."
    ]
    for txt in db_txt:
        p = tf_db.add_paragraph()
        p.text = txt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(6)

    # Right: Community Reporting UI Card
    add_card(slide7, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9), bg_color=CARD_BG, border_color=TEAL)
    tb_rep = slide7.shapes.add_textbox(Inches(7.0), Inches(1.9), Inches(5.3), Inches(4.6))
    tf_rep = tb_rep.text_frame
    tf_rep.word_wrap = True

    p = tf_rep.paragraphs[0]
    p.text = "🚩 In-Popup Community Flagging"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEAL

    rep_txt = [
        "1. Instant Threat Submission:\n   Users can click '🚩 Report Malicious Address' directly inside the extension popup.",
        "2. Threat Categories:\n   - 🎣 Phishing Address\n   - 💸 Wallet Drainer\n   - 📉 Rug Pull Project\n   - 🎭 Impersonation\n   - ⚠️ Other Scam Activity",
        "3. Dynamic Scoring Impact:\n   Reported addresses receive immediate reputation score deductions upon verification.",
        "4. Anti-Abuse Protection:\n   Client fingerprinting and rate-limiting prevent report spam."
    ]
    for txt in rep_txt:
        p = tf_rep.add_paragraph()
        p.text = txt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(6)

    add_footer(slide7, 7)

    # ==========================================
    # SLIDE 8: User Interface & 4-Tab Popup Design
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide8)
    add_header(slide8, "REDESIGNED POPUP UI & WEBPAGE HOVER OVERLAY", "DARK GLASSMORPHISM EXPERIENCE")

    # 4 Cards Layout (2x2 Grid)
    gw = Inches(5.6)
    gh = Inches(2.35)

    tabs_info = [
        ("📊 Tab 1: Score & 6-Metric Mini Grid", GOLD, [
            "• Reputation dial gauge with color-coded risk badge.",
            "• Network badge (ETH, BTC, SOL, ADA, DOT, XRP).",
            "• 6-Metric Mini Grid: Wallet Age, Tx Count, Live Balance (USD), Transacted Volume (USD), Scam Reports, Graph Risk."
        ], Inches(0.8), Inches(1.8)),

        ("🔍 Tab 2: XAI Details & Threat Form", EMERALD, [
            "• Smart contract verification pill & Etherscan link.",
            "• XAI Trust Signals & Risk Flags with non-clipping glassmorphism scrollbars.",
            "• Nvidia AI synthesis card & community threat report modal button."
        ], Inches(6.8), Inches(1.8)),

        ("💬 Tab 3: Interactive AI Chat Assistant", TEAL, [
            "• Conversational Nemotron AI security consultant.",
            "• Horizontal quick-question chips bar ('Is it safe?', 'Why suspicious?', 'Risky connections?').",
            "• Real-time contextual answer rendering."
        ], Inches(0.8), Inches(4.35)),

        ("📋 Tab 4: Scan History & Hover Overlay", GOLD, [
            "• Persistent scan log stored in chrome.storage.local (last 25 addresses).",
            "• One-click address re-scanning & history clearing.",
            "• Webpage Floating Hover Card: Injected dark card on badge click without leaving the page."
        ], Inches(6.8), Inches(4.35))
    ]

    for title, color, points, x, y in tabs_info:
        add_card(slide8, x, y, gw, gh, bg_color=CARD_BG, border_color=color)
        tb = slide8.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), gw - Inches(0.4), gh - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = color

        for pt in points:
            p_pt = tf.add_paragraph()
            p_pt.text = pt
            p_pt.font.size = Pt(10.5)
            p_pt.font.color.rgb = TEXT_MAIN
            p_pt.space_before = Pt(2)

    add_footer(slide8, 8)

    # ==========================================
    # SLIDE 9: Complete Tech Stack
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide9)
    add_header(slide9, "END-TO-END TECHNOLOGY STACK ARCHITECTURE", "PRODUCTION INFRASTRUCTURE")

    # Table of Tech Stack
    rows, cols = 7, 3
    left, top, width, height = Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.9)
    table_shape = slide9.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    table.columns[0].width = Inches(2.8)
    table.columns[1].width = Inches(4.2)
    table.columns[2].width = Inches(4.733)

    headers = ["Layer / Component", "Technologies & Frameworks", "Role & Key Responsibilities"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG_ALT
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = GOLD

    tstack_data = [
        ("Extension Frontend", "Manifest V3, Vanilla JS (ES6+), Glassmorphism CSS", "DOM TreeWalker parsing, MutationObserver, hover overlay, 4-tab popup UI, chrome.storage."),
        ("Backend API Server", "Node.js, Express.js, Vercel Serverless Functions", "RESTful API routing, CORS management, rate-limiting, production global CDN hosting."),
        ("Database & Storage", "Supabase PostgreSQL, node-postgres (pg.Pool)", "Threat reports, persistent user watchlists, connection pooling over SSL."),
        ("Blockchain APIs", "Etherscan, Blockstream Esplora, Koios, Subscan, XRPL", "Multi-chain transaction history, contract ABI verification, UTXO balances, account metadata."),
        ("Crypto Market Data", "CoinGecko Live Prices API", "Real-time USD price feeds for BTC, ETH, SOL, ADA, DOT, XRP, BNB with 5-min caching."),
        ("AI / ML Gateway", "OpenRouter (Nvidia Nemotron 3.5 Lightning, Gemma 2)", "Plain-English security summaries, conversational Q&A, multi-model fallback cascade.")
    ]

    for row_idx, data in enumerate(tstack_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_MAIN if col_idx != 0 else GOLD

    add_footer(slide9, 9)

    # ==========================================
    # SLIDE 10: Comparative Analysis
    # ==========================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide10)
    add_header(slide10, "COMPARATIVE ANALYSIS: REPUTEX VS TRADITIONAL EXPLORERS", "EFFICIENCY & CAPABILITY MATRIX")

    # Top summary card
    add_card(slide10, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.0), bg_color=CARD_BG_ALT, border_color=EMERALD)
    tb_c = slide10.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.3), Inches(0.8))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    p = tf_c.paragraphs[0]
    p.text = "⚡ 30x–100x Efficiency Boost Over Manual Lookups"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = EMERALD
    p2 = tf_c.add_paragraph()
    p2.text = "Traditional manual checking requires 90–180 seconds per address across copy-pasting, tab switching, and log reading. ReputeX automatically evaluates all addresses on a page simultaneously in under 3 seconds."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = TEXT_MAIN

    # Comparison Table
    rows, cols = 6, 6
    left, top, width, height = Inches(0.8), Inches(3.0), Inches(11.733), Inches(3.7)
    table_shape = slide10.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    widths = [Inches(2.533), Inches(1.8), Inches(1.8), Inches(1.8), Inches(1.8), Inches(2.0)]
    for idx, w in enumerate(widths):
        table.columns[idx].width = w

    headers = ["Feature / Capability", "Etherscan", "Blockchain.com", "Solscan", "CertiK", "ReputeX"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG_ALT
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = GOLD if i == 5 else TEXT_MAIN

    comp_data = [
        ("Multi-Chain Support", "❌ EVM Only", "❌ BTC Only", "❌ SOL Only", "✅ Multi-chain", "✅ 6 Chains + ENS"),
        ("Zero-Click Webpage Scan", "❌ No", "❌ No", "❌ No", "❌ No", "✅ Inline DOM Scan"),
        ("AI Security Summaries", "❌ None", "❌ None", "❌ None", "⚠️ Static Text", "✅ Nemotron AI Q&A"),
        ("Continuous Math Score", "❌ None", "❌ None", "❌ None", "⚠️ Coarse Grade", "✅ Continuous (0-100)"),
        ("Community Reporting", "❌ No", "❌ No", "❌ No", "✅ Limited", "✅ Supabase Direct")
    ]

    for row_idx, data in enumerate(comp_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(11)
            p.font.color.rgb = EMERALD if (col_idx == 5 or text.startswith("✅")) else (RED if text.startswith("❌") else GOLD)

    add_footer(slide10, 10)

    # ==========================================
    # SLIDE 11: Target Audiences & Use Cases
    # ==========================================
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide11)
    add_header(slide11, "TARGET AUDIENCES & REAL-WORLD USE CASES", "WEB3 APPLICATION SCENARIOS")

    # 6 Cards Grid (3x2)
    cw = Inches(3.64)
    ch = Inches(2.25)
    gx = Inches(0.4)
    gy = Inches(0.2)

    use_cases = [
        ("1. Everyday Crypto Users", GOLD, "Browsing Twitter/X or Discord and encountering wallet addresses. ReputeX shows inline risk badges instantly to prevent sending funds to scam wallets."),
        ("2. DeFi Traders & Farmers", EMERALD, "Evaluating new yield protocols. Automatically audits smart contract verification status on Etherscan before signing approval transactions."),
        ("3. NFT Collectors & Traders", TEAL, "Browsing OpenSea, Blur, or MagicEden. Verifies seller wallet age, transaction history, and counterparty graph before purchasing NFTs."),
        ("4. Web3 Journalists & Analysts", GOLD, "Investigating on-chain movements. Batch scans multiple addresses across articles and forum posts simultaneously with AI summaries."),
        ("5. Exchange Compliance & AML", EMERALD, "Compliance teams screening customer deposit addresses. Integrates ReputeX REST API endpoints for automated address risk profiling."),
        ("6. Web3 Community Managers", TEAL, "Protecting Discord and Telegram groups from impersonators. Members can instantly verify any address shared in chat via the browser extension.")
    ]

    for idx, (title, color, desc) in enumerate(use_cases):
        col_i = idx % 3
        row_i = idx // 3
        x = Inches(0.8) + col_i * (cw + gx)
        y = Inches(1.8) + row_i * (ch + gy)

        add_card(slide11, x, y, cw, ch, bg_color=CARD_BG, border_color=color)
        tb = slide11.shapes.add_textbox(x + Inches(0.15), y + Inches(0.15), cw - Inches(0.3), ch - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = color

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.space_before = Pt(4)

    add_footer(slide11, 11)

    # ==========================================
    # SLIDE 12: Developer API Reference
    # ==========================================
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide12)
    add_header(slide12, "RESTFUL BACKEND API REFERENCE & INTEGRATION", "DEVELOPER API ENDPOINTS")

    # Top Base URL Card
    add_card(slide12, Inches(0.8), Inches(1.8), Inches(11.733), Inches(0.7), bg_color=CARD_BG_ALT, border_color=GOLD)
    tb_b = slide12.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(11.3), Inches(0.6))
    tf_b = tb_b.text_frame
    p = tf_b.paragraphs[0]
    p.text = "🌐 Production Base URL: https://repute-x-iota.vercel.app/api/reputation"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = GOLD

    # Table of API Endpoints
    rows, cols = 7, 3
    left, top, width, height = Inches(0.8), Inches(2.6), Inches(11.733), Inches(4.1)
    table_shape = slide12.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(4.0)
    table.columns[2].width = Inches(5.533)

    headers = ["Method & Endpoint", "Purpose / Action", "Payload & Output Details"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG_ALT
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = GOLD

    api_data = [
        ("POST /analyze", "Single Address Scan", "Payload: { address: '0x...' }. Returns full XAI score, metrics grid, factors, Nemotron summary."),
        ("POST /batch", "High-Speed Batch Scan", "Payload: { addresses: [...] }. Analyzes up to 50 addresses simultaneously in parallel."),
        ("POST /chat", "Nemotron AI Security Q&A", "Payload: { address, question, context }. Returns AI consultant response string."),
        ("GET /prices", "Live Crypto Price Feed", "Returns cached CoinGecko prices for BTC, ETH, SOL, ADA, DOT, XRP, BNB."),
        ("POST /report", "Community Threat Report", "Payload: { address, category, description }. Inserts report into Supabase `public.reports`."),
        ("GET /reports/:address", "Fetch Threat Reports", "Returns list of existing community threat reports submitted for a target address.")
    ]

    for row_idx, data in enumerate(api_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(10.5)
            p.font.color.rgb = EMERALD if col_idx == 0 else TEXT_MAIN

    add_footer(slide12, 12)

    # ==========================================
    # SLIDE 13: Privacy & Security Commitments
    # ==========================================
    slide13 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide13)
    add_header(slide13, "PRIVACY, SECURITY COMMITMENTS & STORE BUILDS", "TRUST & COMPLIANCE")

    # Left: Security & Privacy Commitments
    add_card(slide13, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9), bg_color=CARD_BG, border_color=EMERALD)
    tb_sec = slide13.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.2), Inches(4.6))
    tf_sec = tb_sec.text_frame
    tf_sec.word_wrap = True

    p = tf_sec.paragraphs[0]
    p.text = "🔒 Non-Custodial & Privacy Guarantees"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = EMERALD

    sec_items = [
        "• Zero Private Key Access: ReputeX never requests, accesses, or stores private keys, seed phrases, or wallet connections.",
        "• Isolated World Content Scripts: Content scripts run in strict isolated environments without injecting external third-party `<script>` tags.",
        "• Safe XSS-Free DOM Operations: Exclusively uses `textContent` and `createElement` DOM methods — zero `innerHTML` injection.",
        "• Local Scan History: Scan logs remain stored exclusively in client `chrome.storage.local`.",
        "• Zero Telemetry / Tracking: No user behavior tracking, profiling, or sellable analytical logs."
    ]
    for item in sec_items:
        p = tf_sec.add_paragraph()
        p.text = item
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(6)

    # Right: Cross-Browser Store Compatibility
    add_card(slide13, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9), bg_color=CARD_BG, border_color=GOLD)
    tb_bld = slide13.shapes.add_textbox(Inches(7.0), Inches(1.9), Inches(5.3), Inches(4.6))
    tf_bld = tb_bld.text_frame
    tf_bld.word_wrap = True

    p = tf_bld.paragraphs[0]
    p.text = "📦 Cross-Browser Store Packages"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = GOLD

    bld_items = [
        "• Chrome Web Store (`ReputeX-Chrome-Extension-v2.1.zip`): Chromium Manifest V3 compliant package.",
        "• Microsoft Edge Add-ons (`ReputeX-Edge-Extension-v2.1.zip`): Edge store target.",
        "• Mozilla AMO (`ReputeX-Firefox-Extension-v2.1.zip`): Gecko MV3 manifest with Gecko ID and host permissions.",
        "• Opera & Brave Extensions (`ReputeX-Opera-Extension-v2.1.zip`): Opera & Brave desktop target.",
        "• Strict POSIX Compliance: All zip archives are built with forward-slash paths via Python packaging scripts to pass automated store linters."
    ]
    for item in bld_items:
        p = tf_bld.add_paragraph()
        p.text = item
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(6)

    add_footer(slide13, 13)

    # ==========================================
    # SLIDE 14: Scoring Benchmark & Future Roadmap
    # ==========================================
    slide14 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide14)
    add_header(slide14, "SCORING BENCHMARKS & PRODUCT ROADMAP", "REPUTEX VERSION 2.1 & BEYOND")

    # Left: Scoring Benchmarks
    add_card(slide14, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9), bg_color=CARD_BG, border_color=GOLD)
    tb_bm = slide14.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.2), Inches(4.6))
    tf_bm = tb_bm.text_frame
    tf_bm.word_wrap = True

    p = tf_bm.paragraphs[0]
    p.text = "🏆 Empirical Scoring Benchmarks"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = GOLD

    benchmarks = [
        ("vitalik.eth (Ethereum Founder)", "Score: 100", EMERALD, "Massive age, 5000+ txs, verified contract interactions."),
        ("Satoshi Genesis BTC Address", "Score: 100", EMERALD, "Historical age, legendary trust profile."),
        ("Active DeFi Trader", "Score: 91.4", EMERALD, "2+ years active, 450+ peers, 12 protocols."),
        ("Casual Web3 User", "Score: 61.2", GOLD, "6 months active, 50 txs, standard profile."),
        ("Dormant Wallet", "Score: 56.0", GOLD, "1 year old, 5 txs, minimal activity."),
        ("Flagged Scam Drainer", "Score: 0.0", RED, "Direct match in scam database & threat reports.")
    ]

    for title, score, color, desc in benchmarks:
        p = tf_bm.add_paragraph()
        p.text = f"• {title} → {score}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_before = Pt(3)

        p_d = tf_bm.add_paragraph()
        p_d.text = f"  {desc}"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED

    # Right: Future Roadmap
    add_card(slide14, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9), bg_color=CARD_BG, border_color=TEAL)
    tb_rm = slide14.shapes.add_textbox(Inches(7.0), Inches(1.9), Inches(5.3), Inches(4.6))
    tf_rm = tb_rm.text_frame
    tf_rm.word_wrap = True

    p = tf_rm.paragraphs[0]
    p.text = "🚀 Future Feature Roadmap"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEAL

    roadmap = [
        "1. Pre-Sign Transaction Simulation:\n   Preview state changes, asset transfers, and approval risks before signing transactions in MetaMask/Phantom.",
        "2. Watchlist Real-Time Alerts:\n   WebPush notifications when bookmarked addresses initiate suspicious high-value transactions.",
        "3. Network Graph Visualization:\n   Interactive 2D/3D visual counterparty graph mapping 1-hop and 2-hop entity relationships.",
        "4. Mobile Companion App:\n   Standalone iOS & Android wallet reputation scanner using device camera QR code reader.",
        "5. DAO Governance Reputation:\n   Reputation-weighted voting mechanisms for community threat validation."
    ]

    for item in roadmap:
        p = tf_rm.add_paragraph()
        p.text = item
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MAIN
        p.space_before = Pt(6)

    add_footer(slide14, 14)

    # Save presentation
    output_path = os.path.join(r"c:\Users\Aldrid\Desktop\ReputeX", "ReputeX_presentation.pptx")
    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    create_presentation()
