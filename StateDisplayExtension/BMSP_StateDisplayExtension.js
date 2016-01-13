//=============================================================================
// BMSP_StateDisplayExtension.js (ステート表示拡張)
//=============================================================================

/*:
 * @plugindesc ステート表示を拡張します。
 * @author gentlawk
 * @website http://blueredzone.com
 * @url https://github.com/gentlawk/BMSP_MV
 * @license
 * Copyright(c) 2015 BlueRedZone, gentlawk
 * Released under the MIT license
 * https://github.com/gentlawk/BMSP_MV/blob/master/LICENSE
 *
 * @version 1.01
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
 * @param DrawSingle
 * @desc 1でステートアイコンを1つずつ表示、0で可能な限り同時にステートアイコンを表示します。
 * @default 0
 *
 * @help
 * 必須プラグイン:
 *   BMSP_ContentsUpdator ver1.00以上
 *
 * 使用方法:
 *   アクターの現在のステートすべてを確認できるように表示します。
 *
 * ●アニメーションタイプ:
 *   切り替えアニメーションのタイプはデフォルトでは以下が使用可能です。
 *   ・slideUp
 *     上方向にスライド
 *   ・slideDown
 *     下方向にスライド
 *   ・slideRight
 *     右方向にスライド
 *   ・slideLeft
 *     左方向にスライド
 *   ・fade
 *     クロスフェード
 */


(function () {

    /*
     * プラグインバージョン
     */
    PluginManager.setVersion('BMSP_StateDisplayExtension', 1.01);
    
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
     * StateDisplayExtension
     */
    BMSP.StateDisplayExtension = function () {
        throw new Error('This is a static class');
    };
    
    var parameters = PluginManager.parameters('BMSP_StateDisplayExtension');
    BMSP.StateDisplayExtension._animationType = parameters['AnimationType'];
    BMSP.StateDisplayExtension._animationDuration = Number(parameters['AnimationDuration']);
    BMSP.StateDisplayExtension._waitDuration = Number(parameters['WaitDuration']);
    BMSP.StateDisplayExtension._drawSingle = Boolean(Number(parameters['DrawSingle']));
    
    /*
     * Window_Base
     */
    var _Window_Base_drawActorIcons = Window_Base.prototype.drawActorIcons;
    Window_Base.prototype.drawActorIcons = function(actor, x, y, width) {
        width = width || 144;
        var areaName = 'stateIcons_actor' + actor.actorId();
        var area = this.areaManager.registerAutoUpdateArea(areaName, x, y, width, Window_Base._iconHeight);
        area.lazy = true;
        area.setAnimationType(BMSP.StateDisplayExtension._animationType);
        area.setWaitDuration(BMSP.StateDisplayExtension._animationDuration);
        area.setAnimationDuration(BMSP.StateDisplayExtension._waitDuration);
        area.removeAllPanels();
        
        var icons = actor.allIcons();
        var bitmap = ImageManager.loadSystem('IconSet');
        var pw = Window_Base._iconWidth;
        var ph = Window_Base._iconHeight;
        var column = Math.floor(width / pw);
        if (column < 0 || BMSP.StateDisplayExtension._drawSingle) column = 1;
        for (var i = 0; i < icons.length; i++) {
            var iconIndex = icons[i]
            var sx = iconIndex % 16 * pw;
            var sy = Math.floor(iconIndex / 16) * ph;
            var panelIndex = Math.floor(i / column);
            var panel = area.addPanel('stateIcon'+panelIndex);
            panel.bitmap.blt(bitmap, sx, sy, pw, ph, pw * (i % column), 0);
        }
    };
    
})();