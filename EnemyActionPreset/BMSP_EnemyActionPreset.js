//=============================================================================
// BMSP_EnemyActionPreset.js (行動パターンプリセット)
//=============================================================================

/*:
 * @plugindesc 任意の敵キャラの行動パターンをプリセットとして使用します。
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
 * @param Label
 * @desc 行動パターン追加メモのラベルです。
 * @default 行動パターン追加
 *
 * @help
 * 敵キャラのメモ:
 *   <行動パターン追加:%idlist%>  # 敵キャラID%idlist%の持つ行動パターンを追加します。
 *     - %idlist% : カンマ区切りのIDリスト
 *   ※メモのラベルはパラメータで変更可能です。
 *
 * 使用方法:
 *   敵キャラのメモに設定を記述すると、その敵キャラがもつ行動パターンを持った敵キャラとなります。
 *
 * ●使用例:
 *   エネミーID2と3の行動パターンを追加
 *     <行動パターン追加:2,3>
 *
 * ※循環参照に注意して下さい。
 */

(function() {

    /*
     * プラグインバージョン
     */
    PluginManager.setVersion('BMSP_EnemyActionPreset', 1.02);

    /*
     * EnemyActionPreset
     */
    BMSP.EnemyActionPreset = function() {
        throw new Error('This is a static class');
    };

    BMSP.EnemyActionPreset._flag_addon = {};

    var parameters = PluginManager.parameters('BMSP_EnemyActionPreset');
    BMSP.EnemyActionPreset._label  = parameters['Label'];

    BMSP.EnemyActionPreset.getObjectsFromNote = function(object, note, container) {
        return note.split(',').reduce(function(preset, id) {
            if(!(id in container)){
                return preset;
            }
            var obj = container[id];
            return preset.concat(obj);
        }, []);
    }

    BMSP.EnemyActionPreset.getPresetObjects = function(object) {
        var objects = [];
        if(this._label in object.meta) {
            objects = objects.concat(this.getObjectsFromNote(object, object.meta[this._label], $dataEnemies));
        }
        return objects;
    };

    BMSP.EnemyActionPreset.setAddon = function(object) {
        var objectId = BMSP.getObjectId(object);
        if(objectId in this._flag_addon) {
            return;
        }
        var preset = this.getPresetObjects(object);
        object.actions = preset.reduce(function(actions, obj) {
            BMSP.EnemyActionPreset.setAddon(obj);
            return actions.concat(obj.actions);
        }, object.actions);
        this._flag_addon[objectId] = true;
    };

    BMSP.EnemyActionPreset.init = function() {
        var data = $dataEnemies;
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
        BMSP.EnemyActionPreset.init();
        _Scene_Boot_start.call(this);
    };

})();
