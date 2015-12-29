//=============================================================================
// BMSP_TraitPreset.js
//=============================================================================

/*:
 * @plugindesc 任意のデータの特徴をプリセットとして使用します。
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
 * @param Label_Actor
 * @desc アクターの特徴追加メモのラベルです。
 * @default アクター特徴追加
 *
 * @param Label_Class
 * @desc 職業の特徴追加メモのラベルです。
 * @default 職業特徴追加
 *
 * @param Label_Weapon
 * @desc 武器の特徴追加メモのラベルです。
 * @default 武器特徴追加
 *
 * @param Label_Armor
 * @desc 防具の特徴追加メモのラベルです。
 * @default 防具特徴追加
 *
 * @param Label_Enemy
 * @desc 敵キャラの特徴追加メモのラベルです。
 * @default 敵特徴追加
 *
 * @param Label_State
 * @desc ステートの特徴追加メモのラベルです。
 * @default ステート特徴追加
 *
 * @help
 * アクター、職業、武器、防具、敵キャラ、ステートのメモ:
 *   <アクター特徴追加:%idlist%>   # アクターID%idlist%の持つ特徴を追加します。
 *   <職業特徴追加:%idlist%>       # 職業ID%idlist%の持つ特徴を追加します。
 *   <武器特徴追加:%idlist%>       # 武器ID%idlist%の持つ特徴を追加します。
 *   <防具特徴追加:%idlist%>       # 防具ID%idlist%の持つ特徴を追加します。
 *   <敵特徴追加:%idlist%>         # 敵キャラID%idlist%の持つ特徴を追加します。
 *   <ステート特徴追加:%idlist%>   # ステートID%idlist%の持つ特徴を追加します。
 *     %idlist%: カンマ区切りのIDリスト
 *   ※各種メモのラベルはパラメータで変更可能です。
 *
 * 使用方法:
 *   アクター、職業、武器、防具、敵キャラ、ステートのメモにデータのIDを
 *   任意個並べた設定を記述すると、そのデータがもつ特徴を持ったデータとなります。
 *
 * 使用例:
 *   エネミーID2と3の特徴を追加
 *     <敵特徴追加:2,3>
 *
 * ※循環参照に注意して下さい。
 */

(function() {

    /*
     * プラグインバージョン
     */
    PluginManager.setVersion('BMSP_TraitPreset', 1.00);

    /*
     * TraitPreset
     */
    BMSP.TraitPreset = function() {
        throw new Error('This is a static class');
    };

    BMSP.TraitPreset._flag_addon = {};

    var parameters = PluginManager.parameters('BMSP_TraitPreset');
    BMSP.TraitPreset._label_actor  = parameters['Label_Actor'];
    BMSP.TraitPreset._label_class  = parameters['Label_Class'];
    BMSP.TraitPreset._label_weapon = parameters['Label_Weapon'];
    BMSP.TraitPreset._label_armor  = parameters['Label_Armor'];
    BMSP.TraitPreset._label_enemy  = parameters['Label_Enemy'];
    BMSP.TraitPreset._label_state  = parameters['Label_State'];

    BMSP.TraitPreset.getObjectsFromNote = function(object, note, container) {
        return note.split(',').reduce(function(preset, id) {
            if(!(id in container)){
                return preset;
            }
            var obj = container[id];
            return preset.concat(obj);
        }, []);
    }

    BMSP.TraitPreset.getPresetObjects = function(object) {
        var objects = [];
        if(this._label_actor in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_actor], $dataActors));
        }
        if(this._label_class in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_class], $dataClasses));
        }
        if(this._label_weapon in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_weapon], $dataWeapons));
        }
        if(this._label_armor in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_armor], $dataArmors));
        }
        if(this._label_enemy in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_enemy], $dataEnemies));
        }
        if(this._label_state in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label_state], $dataStates));
        }
        return objects;
    };

    BMSP.TraitPreset.setAddon = function(object) {
        var objectId = BMSP.getObjectId(object);
        if(objectId in this._flag_addon) {
            return;
        }
        var preset = this.getPresetObjects(object);
        object.traits = preset.reduce(function(traits, obj) {
            BMSP.TraitPreset.setAddon(obj);
            return traits.concat(obj.traits);
        }, object.traits);
        this._flag_addon[objectId] = true;
    };

    BMSP.TraitPreset.init = function() {
        var data = $dataActors.concat($dataClasses, $dataWeapons, $dataArmors, $dataEnemies, $dataStates);
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
        BMSP.TraitPreset.init();
        _Scene_Boot_start.call(this);
    };

})();
