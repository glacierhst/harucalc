let queue = [];
let activeIdx = -1;
let dragIdx = null;

const SCALING = {
    m0: { cx1:325.1, cx2:333.8, cx3:379.9, tq:899.2, lx:1035.7, zj:3908.6, pg:211.0, pg4:180.3, pg5:266.0, zl:83.0, tq_x:1026.8, zj_ex:473, support: 169 },
    m3: { cx1:354.7, cx2:364.2, cx3:414.5, tq:981.0, lx:1129.9, zj:4264.0, pg:230.2, pg4:196.7, pg5:290.2, zl:90.6, tq_x:1120.2, zj_ex:516, support: 184.4 },
    m5: { cx1:384.3, cx2:394.6, cx3:449.1, tq:1062.8, lx:1224.1, zj:4619.4, pg:249.4, pg4:213.1, pg5:314.4, zl:98.2, tq_x:1213.6, zj_ex:559, dcb:1500, support: 199.8 }
};

const gV = id => parseFloat(document.getElementById(id).value) || 0;
const gC = id => document.getElementById(id).checked;
const gS = id => document.getElementById(id).value;

function refreshZhuLeiLogic() {
    const inBrk = gC('env_break');
    const isStrong = gC('m_strong');
    
    if (isStrong) {
        for (let i = 0; i < queue.length; i++) {
            if (queue[i].id === 'tq' || queue[i].id === 'tq_x') {
                const prev = i > 0 ? queue[i-1].id : "";
                const triggers = ['pg4', 'pg5', 'cx1', 'cx2', 'cx3', 'zj', 'support'];
                if (triggers.includes(prev)) {
                    queue[i].id = 'tq_x';
                    queue[i].name = '强化特殊技：地网·巡弋';
                } else {
                    queue[i].id = 'tq';
                    queue[i].name = '强化特殊技：地网';
                }
            }
        }
    } else {
        for (let i = 0; i < queue.length; i++) {
            if (queue[i].id === 'tq_x') {
                queue[i].id = 'tq';
                queue[i].name = '强化特殊技：地网';
            }
        }
    }

    if (inBrk && isStrong) {
        let newQ = [];
        for (let i = 0; i < queue.length; i++) {
            newQ.push(queue[i]);
            if (queue[i].id.startsWith('cx') && !queue[i].isZl) {
                if (!queue[i+1] || !queue[i+1].isZl) {
                    newQ.push({ id:'zl', name:'逐雷 (附加)', isZl:true, uid:Math.random() });
                }
            }
        }
        queue = newQ;
    } else {
        queue = queue.filter(i => !i.isZl);
    }
}

function handleToggleCondition() {
    refreshZhuLeiLogic();
    update();
}

function handleTeammateToggle(type) {
    if (!gC('b_' + type)) {
        if (type === 'yjy') { document.getElementById('yjy_const').value = "0"; }
        if (type === 'ly') { document.getElementById('ly_const').value = "0"; document.getElementById('ly_wp_select').value = "none"; }
        if (type === 'bj') { document.getElementById('bj_const').value = "0"; document.getElementById('bj_wp_select').value = "none"; }
    }
    update();
}

function addSkill() {
    const sel = document.getElementById('sk_sel');
    queue.push({ id: sel.value, name: sel.options[sel.selectedIndex].text, isZl:false, uid:Math.random() });
    refreshZhuLeiLogic();
    activeIdx = queue.length - 1;
    update();
}

function clearQueue() { queue = []; activeIdx = -1; update(); }

function exportConfig() {
    const data = {
        params: {
            y_const: gS('y_const'), p_atk: gV('p_atk'), p_cr: gV('p_cr'), p_cd: gV('p_cd'), p_pen_r: gV('p_pen_r'), p_pen_v: gV('p_pen_v'), p_ele_dmg: gV('p_ele_dmg'),
            m_strong: gC('m_strong'), y_wp: gS('y_wp'), y_ref: gS('y_ref'), s4_set: gS('s4_set'),
            env_break: gC('env_break'), env_abnormal: gC('env_abnormal'),
            b_yjy: gC('b_yjy'), yjy_atk: gV('yjy_atk'), yjy_const: gS('yjy_const'),
            b_ly: gC('b_ly'), ly_const: gS('ly_const'), ly_ref: gS('ly_ref'), ly_wp_select: gS('ly_wp_select'),
            b_bj: gC('b_bj'), bj_const: gS('bj_const'), bj_ref: gS('bj_ref'), bj_wp_select: gS('bj_wp_select'),
            b_nk: gC('b_nk'), b_ap: gC('b_ap'), b_mg: gC('b_mg'), b_jy: gC('b_jy'), b_sdx: gC('b_sdx'),
            e_def: gV('e_def'), e_res: gV('e_res'), e_vun: gV('e_vun')
        },
        queue: queue.map(i => ({ id: i.id, name: i.name, isZl: i.isZl }))
    };
    navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("配置已导出至剪贴板"));
}

function importConfig() {
    const t = prompt("粘贴配置JSON:");
    if (!t) return;
    try {
        const data = JSON.parse(t);
        const p = data.params;
        for(let k in p) {
            const el = document.getElementById(k);
            if(el) {
                if(el.type === 'checkbox') el.checked = p[k];
                else el.value = p[k];
            }
        }
        queue = data.queue.map(i => ({ ...i, uid: Math.random() }));
        refreshZhuLeiLogic();
        activeIdx = 0;
        update();
    } catch(e) { alert("导入失败，格式错误"); }
}

function update() {
    document.getElementById('sub_yjy').style.display = gC('b_yjy') ? 'block' : 'none';
    document.getElementById('sub_ly').style.display = gC('b_ly') ? 'block' : 'none';
    document.getElementById('sub_bj').style.display = gC('b_bj') ? 'block' : 'none';

    const qBox = document.getElementById('q_list');
    qBox.innerHTML = '';
    let tCrit = 0, tExp = 0;

    const categories = {
        cx: { name: "冲刺攻击和逐雷", total: 0, color: "bg-cx" },
        tq: { name: "强化特殊技", total: 0, color: "bg-tq" },
        pg: { name: "普攻和快速支援", total: 0, color: "bg-pg" },
        zj: { name: "终结技", total: 0, color: "bg-zj" },
        lx: { name: "连携技", total: 0, color: "bg-lx" },
        dcb: { name: "电磁爆", total: 0, color: "bg-dcb" }
    };

    queue.forEach((item, i) => {
        const calc = calculateDamage(item, i);
        tCrit += calc.crit; tExp += calc.exp;

        let cat = "pg";
        if (item.id.startsWith('cx') || item.id === 'zl') cat = "cx";
        else if (item.id.startsWith('tq')) cat = "tq";
        else if (item.id === 'zj') cat = "zj";
        else if (item.id === 'lx') cat = "lx";
        else if (item.id === 'dcb') cat = "dcb";
        categories[cat].total += calc.exp;

        const div = document.createElement('div');
        div.className = `q-item ${i === activeIdx ? 'active' : ''} ${item.isZl ? 'is-zl' : ''}`;
        div.draggable = true;
        div.innerHTML = `${item.name} <span class="del" onclick="queue.splice(${i},1);event.stopPropagation();update()">×</span>`;
        div.onclick = () => { activeIdx = i; update(); };
        div.ondragstart = () => { dragIdx = i; };
        div.ondragover = e => e.preventDefault();
        div.ondrop = () => {
            const moved = queue.splice(dragIdx, 1)[0];
            queue.splice(i, 0, moved);
            activeIdx = i;
            refreshZhuLeiLogic();
            update();
        };
        qBox.appendChild(div);
    });

    document.getElementById('total_crit').innerText = Math.floor(tCrit).toLocaleString();
    document.getElementById('total_exp').innerText = Math.floor(tExp).toLocaleString();

    const chartCont = document.getElementById('damage_chart');
    const chartBars = document.getElementById('chart_bars');
    if (tExp > 0) {
        chartCont.style.display = 'block';
        // 修改点：转为数组并按 total 降序排列
        const sortedCats = Object.values(categories)
            .filter(c => c.total > 0)
            .sort((a, b) => b.total - a.total);

        chartBars.innerHTML = sortedCats.map(c => {
            const pct = ((c.total / tExp) * 100).toFixed(1);
            return `
                <div class="chart-item">
                    <div class="chart-label"><span>${c.name}</span><span>${pct}%</span></div>
                    <div class="bar-bg"><div class="bar-fill ${c.color}" style="width:${pct}%"></div></div>
                </div>`;
        }).join('');
    } else {
        chartCont.style.display = 'none';
    }

    if (activeIdx >= 0 && queue[activeIdx]) {
        const current = calculateDamage(queue[activeIdx], activeIdx);
        document.getElementById('selected_detail_summary').style.display = 'flex';
        document.getElementById('sel_crit').innerText = Math.floor(current.crit).toLocaleString();
        document.getElementById('sel_exp').innerText = Math.floor(current.exp).toLocaleString();
        renderDetails(current);
    } else {
        document.getElementById('selected_detail_summary').style.display = 'none';
        document.getElementById('detail_area').innerHTML = '';
    }
}

function calculateDamage(item, idx) {
    const cons = parseInt(gS('y_const'));
    const ref = parseInt(gS('y_ref'));
    const isStrong = gC('m_strong');
    const inBrk = gC('env_break');
    const inAbn = gC('env_abnormal');
    const res = {};

    // 1. 攻击区
    let ap_list = []; 
    let ap_val = 0;
    if (gS('y_wp')==='lh') { let v=[0,28,35,42,49,56][ref]; ap_val+=v/100; ap_list.push(`硫磺石(${v}%)`); }
    if (gS('y_wp')==='xh') { 
        let hasSup = false; for(let k=0; k<idx; k++) if(queue[k].id==='support') hasSup=true;
        if(hasSup && item.id!=='support') { let v=[0,12,13.8,15.6,17.4,19.2][ref]; ap_val+=v/100; ap_list.push(`星辉音擎(${v}%)`); }
    }
    if (gC('b_ap')) { ap_val+=0.16; ap_list.push("阿炮(16%)"); }
    if (gS('s4_set')==='ry') { ap_val+=0.12; ap_list.push("如影4(12%)"); }
    if (gS('s4_set')==='lb' && inAbn) { ap_val+=0.28; ap_list.push("雷暴4(28%)"); }
    if (isStrong) { ap_val+=0.12; ap_list.push("潜能模式(12%)"); }
    
    let af_val = 0; let af_str = "0";
    if (gC('b_yjy')) {
        let limit = gS('yjy_const') >= 2 ? 1600 : 1200;
        let ratio = gS('yjy_const') >= 2 ? 0.54 : 0.35;
        af_val = Math.min(limit, gV('yjy_atk') * ratio);
        af_str = `耀嘉音(${af_val.toFixed(1)})`;
    }
    const atk = gV('p_atk') * (1 + ap_val) + af_val;
    res.atk = { 
        val: Math.floor(atk), 
        formula: `攻击 = 面板(${gV('p_atk')}) × (1 + ${ap_list.length?ap_list.join('+'):'0%'}) + ${af_str} = ${Math.floor(atk)}`,
        log: `局内加成: ${(ap_val*100).toFixed(1)}% | 固定值: ${af_val.toFixed(0)}` 
    };

    // 2. 倍率区
    const tier = cons >= 5 ? 'm5' : (cons >= 3 ? 'm3' : 'm0');
    let actId = item.id;
    let bm = SCALING[tier][actId] || 0;
    let em = (isStrong && item.id === 'zj') ? SCALING[tier].zj_ex : 0;
    if (actId === 'dcb' && cons < 6) bm = 0;
    res.mul = { 
        val: (bm + em).toFixed(1) + "%", 
        formula: `倍率 = 基础(${bm}%) + 潜能补正(${em}%) = ${(bm+em).toFixed(1)}%`,
        log: `档位: ${tier}` 
    };

    // 3. 增伤区
    let db_list = [`面板(${gV('p_ele_dmg')}%)`];
    let db_val = gV('p_ele_dmg')/100;
    if (inBrk || inAbn) { db_val += 0.4; db_list.push("环境失衡/异常(40%)"); }
    if (gC('b_yjy')) { db_val += 0.2; db_list.push("耀嘉音(20%)"); }
    if (gC('b_ly')) { 
        let v = gS('ly_const') >= 2 ? 0.55 : 0.4;
        db_val += v; db_list.push(`琉音(约${v*100}%)`); 
    }
    if (gC('b_mg')) { db_val += 0.18; db_list.push("月光(18%)"); }
    if (gC('b_jy')) { db_val += 0.24; db_list.push("佳音(24%)"); }
    
    const isCx = item.id.startsWith('cx') && !item.isZl;
    if (isCx) {
        if (gS('s4_set')==='ry') { db_val += 0.15; db_list.push("如影2(15%)"); }
        if (cons >= 2) {
            let lastIdx = -1; for(let k=0; k<idx; k++) if(queue[k].id==='lx' || queue[k].id==='zj') lastIdx=k;
            if(lastIdx !== -1) {
                let c = 0; for(let m=lastIdx+1; m<idx; m++) if(queue[m].id.startsWith('cx') && !queue[m].isZl) c++;
                if(c < 7) { db_val += 0.5; db_list.push(`2命冲刺增伤(50%)`); }
            }
        }
        if (gS('y_wp')==='cx') { let v=[0,40,46,52,58,64][ref]; db_val+=v/100; db_list.push(`残心(${v}%)`); }
    }
    res.dmg = { 
        val: (1+db_val).toFixed(3), 
        formula: `系数 = 1 + ${db_list.join(' + ')} = ${(1+db_val).toFixed(3)}`,
        log: `总增伤: ${(db_val*100).toFixed(1)}%`
    };

    // 4. 双暴区
    let cr_list = [`面板(${gV('p_cr')}%)`], cd_list = [`面板(${gV('p_cd')}%)`];
    let cr = gV('p_cr'), cd = gV('p_cd');
    if (gS('s4_set')==='ry') { cr += 12; cr_list.push("如影4(12%)"); }
    if (gC('b_nk')) { cr += 15; cr_list.push("妮可(15%)"); }
    if (isCx || (isStrong && item.id==='zj')) { cr += 25; cd += 72; cr_list.push("天赋(25%)"); cd_list.push("天赋(72%)"); }
    if (gS('y_wp')==='cx') {
        let v=[0,10,11.5,13,14.5,16][ref]; cr+=v; cr_list.push(`残心(${v}%)`);
        if(inBrk || inAbn) { cr+=v; cr_list.push(`残心额外(${v}%)`); }
    }
    if (gC('b_yjy')) { cd += 25; cd_list.push("耀嘉音(25%)"); }
    if (gC('b_sdx')) { cd += 30; cd_list.push("山大王(30%)"); }
    if (gC('b_ly') && gS('ly_wp_select') === 'zn') { 
        let lr=gV('ly_ref'); let v=[0,30,34.5,39,43.5,48][lr]; cd+=v; cd_list.push(`昨夜来电(${v}%)`); 
    }
    if (gC('b_bj') && gS('bj_const') >= 2) { cd += 24; cd_list.push("扳机2命(24%)"); }
    
    let fcr = Math.min(100, cr)/100, fcd = cd/100;
    res.crit_zone = {
        val_exp: (1 + fcr * fcd).toFixed(3),
        cr_f: `暴率 = ${cr_list.join(' + ')} = ${(fcr*100).toFixed(1)}%`,
        cd_f: `爆伤 = ${cd_list.join(' + ')} = ${(fcd*100).toFixed(1)}%`,
        exp_f: `期望 = 1 + ${fcr.toFixed(3)} × ${fcd.toFixed(3)} = ${(1 + fcr * fcd).toFixed(3)}`,
        fcd_pure: fcd,
        fcr_pure: fcr
    };

    // 5. 防御区
    let shred_list = []; let shred_val = 0;
    if (gC('b_nk')) { shred_val += 0.4; shred_list.push("妮可(40%)"); }
    if (gC('b_bj') && gS('bj_wp_select') === 'sh') { 
        let v = [0,25,28.75,32.5,36.25,40][gV('bj_ref')]/100; 
        shred_val += v; shred_list.push(`索魂影眸(${(v*100).toFixed(2)}%)`); 
    }
    let pr = gV('p_pen_r')/100, pv = gV('p_pen_v'), ed = gV('e_def');
    let s1 = ed * (1 - shred_val);
    let s2 = s1 * (1 - pr);
    let s3 = Math.max(0, s2 - pv);
    let fdef = 794 / (s3 + 794);
    res.def = { 
        val: fdef.toFixed(4), 
        formula: `1. 减防后防御 = ${ed} × (1 - ${shred_val.toFixed(3)}) = ${s1.toFixed(1)}\n2. 穿透率后 = ${s1.toFixed(1)} × (1 - ${pr.toFixed(3)}) = ${s2.toFixed(1)}\n3. 穿透值后 = ${s2.toFixed(1)} - ${pv} = ${s3.toFixed(1)}\n4. 防御系数 = 794 / (${s3.toFixed(1)} + 794) = ${fdef.toFixed(4)}`,
        log: `总减防: ${(shred_val*100).toFixed(1)}% | 穿透: ${pr*100}% / ${pv}` 
    };

    // 6. 抗性区
    let res_b = gV('e_res')/100;
    let rs_list = []; let rs_val = 0;
    if(gC('b_yjy') && gS('yjy_const')>=1) { rs_val += 0.18; rs_list.push("耀嘉音1命(18%)"); }
    if(gC('b_ly') && gS('ly_const')>=1) { rs_val += 0.15; rs_list.push("琉音1命(15%)"); }
    if(cons >= 6 && (inBrk || inAbn)) { rs_val += 0.15; rs_list.push("悠真6命(15%)"); }
    if(isStrong && (isCx || item.isZl)) { rs_val += 0.15; rs_list.push("潜能模式(15%)"); }
    let fres = 1 - (res_b - rs_val);
    res.res = { 
        val: fres.toFixed(3), 
        formula: `系数 = 1 - (初始${res_b} - 减抗(${rs_list.length?rs_list.join('+'):'0%'})) = ${fres.toFixed(3)}`,
        log: `净抗性: ${(res_b - rs_val)*100}%` 
    };

    // 7. 失衡易伤区
    let vun_b = inBrk ? gV('e_vun')/100 : 1.0;
    let vs_list = []; let vs_val = 0;
    if (gC('b_bj')) {
        vs_val += 0.35; vs_list.push("扳机(35%)");
        if(gS('bj_const') >= 1) { vs_val += 0.2; vs_list.push("扳机1命(20%)"); }
    }
    if (gC('b_ly') && inBrk) {
        vs_val += 0.3; vs_list.push("琉音(30%)");
        if(gS('ly_const') >= 2) { vs_val += 0.2; vs_list.push("琉音2命(20%)"); }
    }
    let fvun = vun_b + vs_val;
    res.vun = { 
        val: fvun.toFixed(2), 
        formula: `系数 = 初始${vun_b} + 额外(${vs_list.length?vs_list.join('+'):'0'}) = ${fvun.toFixed(2)}`,
        log: `失衡状态: ${inBrk?'是':'否'}` 
    };

    const base = atk * (bm + em)/100 * (1 + db_val) * fdef * fres * fvun;
    res.crit = base * (1 + res.crit_zone.fcd_pure); 
    res.exp = base * (1 + res.crit_zone.fcr_pure * res.crit_zone.fcd_pure); 
    res.name = item.name;
    return res;
}

function renderDetails(res) {
    const area = document.getElementById('detail_area');
    const makeCard = (title, val, formula, log) => `
        <div class="factor-card">
            <div class="factor-header"><span class="factor-title">${title}</span><span class="factor-val">${val}</span></div>
            <div class="formula">${formula}</div>
            <div>${log.split(' | ').map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        </div>`;

    area.innerHTML = `
        <h3 style="color:var(--cyan); margin-bottom:20px;">动作演算：${res.name}</h3>
        ${makeCard("1. 攻击力乘区 (Attack)", res.atk.val, res.atk.formula, res.atk.log)}
        ${makeCard("2. 技能倍率 (Multiplier)", res.mul.val, res.mul.formula, res.mul.log)}
        ${makeCard("3. 增伤乘区 (Damage Bonus)", res.dmg.val, res.dmg.formula, res.dmg.log)}
        <div class="factor-card">
            <div class="factor-header"><span class="factor-title">4. 双暴乘区 (Critical)</span><span class="factor-val">x${res.crit_zone.val_exp}</span></div>
            <div class="formula">${res.crit_zone.cr_f}\n${res.crit_zone.cd_f}\n${res.crit_zone.exp_f}</div>
            <span class="tag">基于期望伤害计算</span>
        </div>
        ${makeCard("5. 防御乘区 (Defense)", res.def.val, res.def.formula, res.def.log)}
        ${makeCard("6. 抗性乘区 (Resistance)", res.res.val, res.res.formula, res.res.log)}
        ${makeCard("7. 失衡易伤 (Vulnerability)", res.vun.val, res.vun.formula, res.vun.log)}
    `;
}

window.onload = update;