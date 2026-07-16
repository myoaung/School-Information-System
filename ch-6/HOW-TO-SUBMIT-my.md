# အခန်း ၆ — ဘယ်လိုတင်ရမလဲ (ကိုယ်ပိုင် Project)

> 🇬🇧 English — [HOW-TO-SUBMIT.md](./HOW-TO-SUBMIT.md)

အခန်း ၆ က **polish + deployment** ပါ။ အခန်း ၅ က open issues တွေ ပိတ်ပါ၊ UI polish လုပ်ပါ၊
တကယ့် README ရေးပါ၊ analytics ထည့်ပါ၊ တကယ် deploy လုပ်ပါ၊ screenshot အသစ် သပ်သပ်ရပ်ရပ် ရိုက်ပါ။
ဒါက **public gallery** ထဲ ဝင်မယ့် version ပါ။

အဆင့်တွေကို အစဉ်လိုက် လုပ်ပါ။

> **repo နှစ်ခု:** အဆင့် ၁–၆ က **ကိုယ်ပိုင် repo**၊ အဆင့် ၇ (report) က **team repo** (`team-NN`)။ ရောမသွားပါစေနဲ့။

---

## ပြီးအောင်လုပ်ရမယ့်အရာတွေ (စစ်ဆေးရန်စာရင်း)

1. ✅ အခန်း ၅ က **open issues တွေ ပိတ်ပြီး** (AI agent / MCP / skill နဲ့ ပြင်)
2. ✅ UI/UX **polish** လုပ်ပြီး
3. ✅ (Web app ဆိုရင်) **Chrome DevTools + Playwright** နဲ့ test လုပ်ပြီး
4. ✅ polish လုပ်ထားတဲ့ **README**
5. ✅ **Analytics** ထည့်ပြီး
6. ✅ **screenshot အသစ်** (Chrome DevTools MCP, resolution သတ်မှတ်)
7. ✅ **public, deployed** live URL
8. ✅ သင့်အဖွဲ့ repo ထဲမှာ ဖြည့်ပြီးသား `report.md`
9. ✅ `doctor.sh ch-6` အကုန် အစိမ်းရောင် ✅ ပြ

---

## အဆင့် ၁ — open issues တွေ ပိတ်ပါ

- အခန်း ၅ မှာ ဖွင့်ခဲ့တဲ့ issue တွေကို **ပြင်ပါ**။
- AI နဲ့ ပြင်ပါ — agent, MCP, (သို့) skill။ တစ်ခုစီ ဘယ်လိုပြင်ခဲ့လဲ report ထဲ မှတ်ပါ။
- GitHub မှာ issue တစ်ခုစီ ပိတ်ပါ။ ပိတ်ပြီး issue တွေကို report ထဲ link လုပ်ပါ။

## အဆင့် ၂ — UI/UX polish လုပ်ပါ

- spacing, အရောင်, စာသား, mobile layout, empty/error state တွေ သပ်ရပ်အောင် လုပ်ပါ။
- Claude (frontend-design skill) ကို review + implement ခိုင်းပါ၊ ပြောင်းတိုင်း **သင်က validate** လုပ်ပါ။

## အဆင့် ၃ — Chrome DevTools + Playwright နဲ့ test (web app)

- **Chrome DevTools MCP** နဲ့ inspect, console error စစ်, responsiveness test လုပ်ပါ။
- **Playwright** နဲ့ သင့် main flow ကို အလိုအလျောက် click-through test လုပ်ပါ။
- (web app မဟုတ်ရင် ဘယ်လို test လုပ်ခဲ့လဲ မှတ်ပါ။)

## အဆင့် ၄ — README polish လုပ်ပါ

- README က front door ပါ — ဘာလဲ၊ ဘယ်သူ့အတွက်လဲ၊ ဘယ်လို run လဲ၊ screenshot တစ်ချပ်။
- Claude ကို draft ခိုင်းပါ၊ စာကြောင်းတိုင်း မှန်/မမှန် **သင်က verify** လုပ်ပါ။

## အဆင့် ၅ — Analytics ထည့်ပါ

- analytics tool ရိုးရိုး တစ်ခု ထည့်ပါ (Plausible, GoatCounter, GA…) — ဘယ်သူ ဝင်ကြည့်လဲ သိအောင်။
- ဘယ်ဟာ သုံးလဲ report ထဲ မှတ်ပါ။

## အဆင့် ၆ — တကယ် deploy + screenshot အသစ်

- **public, polished** version deploy လုပ်ပါ (secrets သန့်ရှင်း — repo ထဲ key မရှိစေနဲ့)။
- **Chrome DevTools MCP** နဲ့ resolution သတ်မှတ်ပြီး **screenshot အသစ်** ရိုက်ပါ
  (desktop **1280×800**, mobile **390×844** — သုံးတဲ့ဟာ မှတ်ပါ)။ repo ထဲ ထားပါ။

  **Sample prompt** (Claude ကို ကူးထည့်) —

  ```text
  Use the chrome-devtools MCP. Set the viewport to 1280x800.
  Open https://<my-live-url>. Take a screenshot and save it as screenshots/01.png.
  Then go to the main feature page and save screenshots/02.png.
  Repeat for my 3 most important screens (01–03).
  ```

> **အဆင့် ၇ က TEAM repo (`team-NN`) ထဲမှာ လုပ်တာ** — ကိုယ်ပိုင် repo မဟုတ်ပါ။

## အဆင့် ၇ — Report ဖြည့်ပါ (TEAM repo ထဲ)

- team repo က private — **fork မလုပ်ပါနဲ့**။ sync → branch → push → PR ဖွင့်ပါ။
- `_TEMPLATE.md` ကို သင့် **team** repo ထဲ `ch-6/<your-github-username>/report.md` အဖြစ် ကူး၊ ဖြည့်၊ ပြီးရင် —

```bash
# ၁. နောက်ဆုံး main ကို sync
git checkout main
git pull

# ၂. ကိုယ်ပိုင် branch ခွဲ — နာမည်ပုံစံ:  <yourname>/ch-6
git checkout -b yourname/ch-6

# ၃. report ကို stage + commit
git add ch-6/yourname/report.md
git commit -m "ch-6: yourname report"

# ၄. branch push
git push -u origin yourname/ch-6

# ၅. GitHub မှာ Pull Request ဖွင့် → review → merge
```

> အဖွဲ့သားက အရင် merge သွားရင် ပြန် sync ပါ — `git checkout main && git pull`၊
> ပြီးရင် ကိုယ့် branch ထဲ `git merge main` (သို့) `git rebase main` လုပ်ပြီး push ပါ။

## အဆင့် ၈ — doctor.sh နဲ့ ကိုယ့်ကိုယ်ကို စစ်ပါ

မတင်ခင် self-check run ပါ —

```bash
bash doctor.sh ch-6
```

အနီ ❌ တွေ ပြင်ပြီး အကုန် အစိမ်း ✅ ဖြစ်တဲ့အထိ ပြန် run ပါ။

## အဆင့် ၉ — Discord မှာ တင်ပါ

- သင့် `#ch-6` channel မှာ ပြီးပြီလို့ ပြောပါ (public live link ကပ်ပါ)။
- ဆရာက ✅ react လုပ်ရင် → သင့် project gallery-ready ဖြစ်ပြီ။

---

### အများဆုံး မှားတတ်တာတွေ

- **issue တွေ မပိတ်ရသေး** → Ch-6 က ပိတ်ဖို့ပါ။ ပြင်ပြီး ပိတ်ပါ၊ ပြီးရင် link လုပ်ပါ။
- **repo ထဲ secrets ပါနေ** → public မလုပ်ခင် key တွေ ဖယ်ပါ။ env var သုံးပါ။
- **README ဗလာ/auto-generated** → တကယ့် front door ဖြစ်အောင် လုပ်ပါ။
- **screenshot မညီ** → Chrome DevTools MCP နဲ့ resolution တစ်ခုတည်း သုံးပါ။

ပိတ်နေရင် team channel မှာ မေးပါ။
