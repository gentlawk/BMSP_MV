//=============================================================================
// BMSP_SkillCostDisplayExtension.js
//=============================================================================

/*:
 * @plugindesc スキルのコスト表示を拡張します。
 * @author gentlawk
 * @website http://blueredzone.com
 * @url https://github.com/gentlawk/BMSP_MV
 * @license
 * Copyright(c) 2015 BlueRedZone, gentlawk
 * Released under the MIT license
 * https://github.com/gentlawk/BMSP_MV/blob/master/LICENSE
 *
 * @version 1.00
 *
 * @param AnimationType
 * @desc 切り替えアニメーションのタイプです。
 * @default slideUp
 *
 * @param WaitDuration
 * @desc 切り替えまでの待機フレーム数です。
 * @default 120
 *
 * @param AnimationDuration
 * @desc 切り替えアニメーションのフレーム数です。
 * @default 60
 *
 * @help
 * 必須プラグイン:
 *   BMSP_ContentsUpdator
 *
 * 使用方法:
 *   スキルのコストが複数ある場合、MP・TPそれぞれのコストを表示します。
 *   他プラグインによりHPコストがある(と思われる)場合はHPコストも表示されます。
 *
 *   切り替えアニメーションのタイプはデフォルトでは以下が使用可能です。
 *   slideUp   : 上方向にスライド
 *   slideDown : 下方向にスライド
 *   slideRight: 右方向にスライド
 *   slideLeft : 左方向にスライド
 *   fade      : クロスフェード
 */


(function () {

    /*
     * プラグインバージョン
     */
    PluginManager.setVersion('BMSP_SkillCostDisplayExtension', 1.00);
    
    /*
     * 必須プラグインチェック
     */
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        BMSP.requirePlugin('BMSP', 1.10);
        BMSP.requirePlugin('BMSP_ContentsUpdator', 1.00);
        _Scene_Boot_start.call(this);
    };

    /*
     * SkillCostDisplayExtension
     */
    BMSP.SkillCostDisplayExtension = function () {
        throw new Error('This is a static class');
    };
    
    var parameters = PluginManager.parameters('BMSP_SkillCostDisplayExtension');
    BMSP.SkillCostDisplayExtension._animationType = parameters['AnimationType'];
    BMSP.SkillCostDisplayExtension._animationDuration = Number(parameters['AnimationDuration']);
    BMSP.SkillCostDisplayExtension._waitDuration = Number(parameters['WaitDuration']);
    
    /*
     * Window_SkillList
     */
    var _Window_SkillList_refresh = Window_SkillList.prototype.refresh;
    Window_SkillList.prototype.refresh = function () {
        this.areaManager.unregisterAll();
        _Window_SkillList_refresh.call(this);
        this.areaManager.update();
    };
    
    var _drawingIndex;
    var _Window_SkillList_drawItem = Window_SkillList.prototype.drawItem;
    Window_SkillList.prototype.drawItem = function(index) {
        _drawingIndex = index;
        _Window_SkillList_drawItem.call(this, index);
    };
    
    var _Window_SkillList_drawSkillCost = Window_SkillList.prototype.drawSkillCost;
    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        var areaName = 'skillcost' + _drawingIndex;
        var areaWidth = this.costWidth();
        var areaX = x + width - areaWidth;
        var area = this.areaManager.registerAutoUpdateArea(areaName, areaX, y, areaWidth, this.lineHeight());
        area.setAnimationType(BMSP.SkillCostDisplayExtension._animationType);
        area.setWaitDuration(BMSP.SkillCostDisplayExtension._animationDuration);
        area.setAnimationDuration(BMSP.SkillCostDisplayExtension._waitDuration);
        var mpCost = this._actor.skillTpCost(skill);
        var tpCost = this._actor.skillMpCost(skill);
        var hpCost = 0;
        if ('skillHpCost' in this._actor) {
            hpCost = this._actor.skillHpCost(skill);
        }
        if (mpCost > 0) {
            var panel = area.addPanel('mpCost');
            panel.syncFontSettings();
            panel.syncDrawSettings();
            panel.bitmap.textColor = this.mpCostColor();
            panel.bitmap.drawText(mpCost, 0, 0, panel.width, panel.height, 'right');
        }
        if (hpCost > 0) {
            var panel = area.addPanel('hpCost');
            panel.syncFontSettings();
            panel.syncDrawSettings();
            panel.bitmap.textColor = this.hpCostColor();
            panel.bitmap.drawText(hpCost, 0, 0, panel.width, panel.height, 'right');
        }
        if (tpCost > 0) {
            var panel = area.addPanel('tpCost');
            panel.syncFontSettings();
            panel.syncDrawSettings();
            panel.bitmap.textColor = this.tpCostColor();
            panel.bitmap.drawText(tpCost, 0, 0, panel.width, panel.height, 'right');
        }
    };
    
})();