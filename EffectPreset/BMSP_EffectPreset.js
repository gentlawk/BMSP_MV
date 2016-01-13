//=============================================================================
// BMSP_EffectPreset.js (使用効果プリセット)
//=============================================================================

/*:
 * @plugindesc 任意のデータの使用効果をプリセットとして使用します。
 * @author gentlawk
 * @website http://blueredzone.com
 * @url https://github.com/gentlawk/BMSP_MV
 * @license
 * Copyright(c) 2015 BlueRedZone, gentlawk
 * Released under the MIT license
 * https://github.com/gentlawk/BMSP_MV/blob/master/LICENSE
 *
 * @version 1.02
 *
 * @param Label_Skill
 * @desc スキルの使用効果追加メモのラベルです。
 * @default スキル効果追加
 *
 * @param Label_Item
 * @desc アイテムの使用効果追加メモのラベルです。
 * @default アイテム効果追加
 *
 * @help
 * スキル、アイテムのメモ:
 *   <スキル効果追加:%idlist%>    # スキルID%idlist%の持つ使用効果を追加します。
 *   <アイテム効果追加:%idlist%>  # アイテムID%idlist%の持つ使用効果を追加します。
 *     - %idlist% : カンマ区切りのIDリスト
 *   ※各種メモのラベルはパラメータで変更可能です。
 *
 * 使用方法:
 *   スキル、アイテムのメモにデータのIDを任意個並べた設定を記述すると、
 *   そのデータがもつ使用効果を持ったデータとなります。
 *
 * ●使用例:
 *   アイテムID2と3の使用効果を追加
 *     <アイテム効果追加:2,3>
 *
 * ※循環参照に注意して下さい。
 */

(function() {

    /*
     * プラグインバージョン
     */
    PluginManager.setVersion('BMSP_EffectPreset', 1.02);

    /*
     * EffectPreset
     */
    BMSP.EffectPreset = function() {
        throw new Error('This is a static class');
    };

    BMSP.EffectPreset._flag_addon = {};

    var parameters = PluginManager.parameters('BMSP_EffectPreset');
    BMSP.EffectPreset._label_skill  = parameters['Label_Skill'];
    BMSP.EffectPreset._label_item  = parameters['Label_Item'];

    BMSP.EffectPreset.getObjectsFromNote = function(object, note, container) {
        return note.split(',').reduce(function(preset, id) {
            if(!(id in container)){
                return preset;
            }
            var obj = container[id];
            return preset.concat(obj);
        }, []);
    }

    BMSP.EffectPreset.getPresetObjects = function(object) {
        var objects = [];
        if(this._label_skill in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_skill], $dataSkills));
        }
        if(this._label_item in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_item], $dataItems));
        }
        return objects;
    };

    BMSP.EffectPreset.setAddon = function(object) {
        var objectId = BMSP.getObjectId(object);
        if(objectId in this._flag_addon) {
            return;
        }
        var preset = this.getPresetObjects(object);
        object.effects = preset.reduce(function(effects, obj) {
            BMSP.EffectPreset.setAddon(obj);
            return effects.concat(obj.effects);
        }, object.effects);
        console.log(object.id);
        console.log(object.effects);
        this._flag_addon[objectId] = true;
    };

    BMSP.EffectPreset.init = function() {
        var data = $dataSkills.concat($dataItems);
        data.forEach(function(object) {
            if(!object) return;
            this.setAddon(object);
        }, this);
    };

    /*
     * Scene_Boot
     */
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        BMSP.requirePlugin('BMSP', 1.00);
        BMSP.EffectPreset.init();
        _Scene_Boot_start.call(this);
    };

})();
