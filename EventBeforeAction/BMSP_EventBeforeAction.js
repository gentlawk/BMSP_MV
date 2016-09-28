//=============================================================================
// BMSP_EventBeforeAction.js (行動前イベント)
//=============================================================================

/*:
 * @plugindesc 戦闘アクション実行前にコモンイベントを起動します。
 * @author gentlawk
 * @website http://blueredzone.com
 * @url https://github.com/gentlawk/BMSP_MV
 * @license
 * Copyright(c) 2015 BlueRedZone, gentlawk
 * Released under the MIT license
 * https://github.com/gentlawk/BMSP_MV/blob/master/LICENSE
 *
 * @version 1.03
 *
 * @help
 * プラグインコマンド:
 *   EventBeforeAction cancelAction  # 「使用前」行動前イベント中に実行するとイベント後のアクションをキャンセル
 *
 * 使用方法:
 *   戦闘アクション実行前にコモンイベントを起動します。
 *   カットインの演出や、特定条件下で発展するスキルなどを表現できます。
 *
 * ●コモンイベントの作成方法
 *   ・コモンイベントの名前
 *     なんでも構いません。わかりやすい名前を付けて下さい。
 *   ・トリガー
 *     なし
 *   ・実行内容
 *     一行目に注釈を作成してください。
 *     内容は
 *       ==行動前イベント:%type%==
 *     と記述します。
 *     %type%は「使用前」もしくは「使用後」で置き換えます。
 *     使用前：スキル・アイテム使用前にコモンイベントを実行します
 *     使用後：スキル・アイテム使用後(使用メッセージが表示され、MPなどが消費された直後)にコモンイベントを実行します
 **
 *     二行目から注釈でないイベントコマンドまでは条件を表す注釈となります。
 *     注釈1つにつき必ず満たすべき条件を書きます。
 *     また、注釈内1行につきいずれかを満たせば良い条件を書きます。
 *     例
 *     //
 *       注釈：条件1
 *           ：条件2
 *       注釈：条件3
 *     //
 *     この例では、条件1かつ条件3を満たすときまたは、
 *     条件2かつ条件3を満たすときにこのイベントが実行されます。
 *     条件以降については任意のイベントコマンドを並べることが出来ます。
 *
 * ●条件の書き方
 *   条件部分は任意のJavascriptを記述します。
 *   特殊な変数として以下の3つを使用できます。
 *   ・use
 *     使用するアイテム・スキルを参照できます。(Game_Item)
 *   ・user
 *     使用するアクター・エネミーを参照できます。(Game_Actor、Game_Enemy)
 *   ・targets
 *     スキル・アイテムのターゲットとなるアクター・エネミーの配列です。
 *     「使用後」のイベントでしか参照できません。
 *     「使用前」のイベントでは空配列となります。
 **
 * ●アクションのキャンセルについて
 *   プラグインコマンド"EventBeforeAction clearAction"を「使用前」のイベント中で呼び出すと、
 *   本来行われるアクションをキャンセルすることが出来ます。
 *   強制アクションと組み合わせることで一定条件下で発展するスキルなどが表現できます。
 *
 * ●使用例
 *   条件の書き方などがよく分からない場合は掲示板(http://blueredzone.bbs.fc2.com/)
 *   にて依頼して頂ければ条件式をお作りします。
 *   ※ただし複雑な場合や実現不能な場合はお断りする場合があります
 *
 *   例：アクター001がスキル「防御」を使用したときに実行
 *   //
 *     注釈：user.isActor() && user.actorId() == 1
 *     注釈：use.isSkill() && use.object().name == '防御'
 *   //
 *   例：アクター001またはアクター002がアイテムを使用したときに実行
 *   //
 *     注釈：user.isActor()
 *     注釈：user.actorId() == 1
 *         ：user.actorId() == 2
 *     注釈：use.isItem()
 *   //
 *   例：ターゲットにID1のエネミーが含まれる場合に実行
 *   //
 *     注釈：targets.some(function(battler){ return battler.isEnemy() && battler.enemyId() == 1;})
 *   //
 *   例：ターゲットにインデックス1のエネミーが含まれる場合に実行
 *   //
 *     注釈：targets.some(function(battler){ return battler == $gameTroop.members()[0];})
 *   //
 */


(function() {

    /*
     * プラグインバージョン
     */
    PluginManager.setVersion('BMSP_EventBeforeAction', 1.03);

    /*
     * プラグインコマンド
     */
    var _Game_Interpreter_pluginCommand =
            Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'EventBeforeAction') {
            switch (args[0]) {
            case 'cancelAction':
                BMSP.EventBeforeAction.reserveCancelAction();
                break;
            }
        }
    };

    /*
     * EventBeforeAction
     */
    BMSP.EventBeforeAction = function() {
        throw new Error('This is a static class');
    };

    BMSP.EventBeforeAction.initRuntime = function() {
        this.clearResult();
        //本来のアクションのキャンセルフラグ
        this.cancelAction = false;
        //インタプリタースタック
        this.stackInpterpreter = [];
        //強制アクションバトラースタック
        this.stackForcedBatterBeforeSetBattler = [];
        this.stackForcedBatterBeforeStartEvent = [];
        //強制アクション時情報スタック
        this.stackForceActions = [];
        //使用前イベントのフェーズスタック
        this.stackPhaseUseSkill = [];
        //使用前イベント内の強制アクションフェーズスタック
        this.stackPhaseForcedUseSkill = [];
        //実行イベントリストのスタック
        this.stackEventList = [];
        //アクションフェーズ移行時のスタック
        this.stackPhaseAction = [];
        this.stackAction = [];
        this.stackTargets = [];
        //使用前イベント実行フラグ
        this.flagExecutedEventBeforeUseSkill = {};
        //通常コモンイベントの退避スタック
        this.stackNormalCommonEvent = [];
    };

    BMSP.EventBeforeAction.init = function() {
        this._beforeUseSkillEvents = [];
        this._beforeInvokeActionEvents = [];
        this.initEvents();
    };

    BMSP.EventBeforeAction.initEvents = function() {
        for(var i = 1; i < $dataCommonEvents.length; i++) {
            var event = $dataCommonEvents[i];
            var list = event.list;
            var commandIndex = 0;
            //行動前イベントか
            if(list[commandIndex].code != 108) continue;
            var match = list[commandIndex].parameters[commandIndex].match(/^==行動前イベント:(使用前|使用後)==$/);
            if(!match) continue;
            var type = match[1];
            while(list[++commandIndex].code == 408) {}
            //条件部の取得
            var conditions = [];
            while(list[commandIndex].code == 108) {
                var command = list[commandIndex];
                var someCondition = [];
                someCondition.push(this.createCondition(command.parameters[0]));
                while((command = list[++commandIndex]).code == 408) {
                    someCondition.push(this.createCondition(command.parameters[0]));
                }
                conditions.push(someCondition);
            }
            //イベントリストに追加
            var eventData = {
                id: event.id,
                conditions: conditions,
            };
            switch(type){
                case '使用前':
                    this._beforeUseSkillEvents.push(eventData);
                    break;
                case '使用後':
                    this._beforeInvokeActionEvents.push(eventData);
                    break;
            }
        }
    };

    BMSP.EventBeforeAction.isEventBeforeActionPhase = function(phase) {
        switch (phase) {
            case 'eventBeforeUseSkill':
            case 'eventBeforeForcedUseSkill':
            case 'eventBeforeInvokeAction':
            case 'eventBeforeForcedInvokeAction':
                return true;
        }
        return false;
    };

    BMSP.EventBeforeAction.getResult = function() {
        return this._conditionResult;
    };

    BMSP.EventBeforeAction.clearResult = function() {
        this._conditionResult = {};
    };

    BMSP.EventBeforeAction.createCondition = function(body) {
        return new Function(
            'use', 'user', 'targets', 'tmp',
            'return [' + body + ', tmp];'
        );
    };

    BMSP.EventBeforeAction.meetsConditions = function(conditions, action, subject, targets) {
        var tmp = null;
        return conditions.every(function(someConditions) {
            return someConditions.some(function(condition) {
                var result = condition(action._item, subject, targets, tmp);
                tmp = result[1];
                return result[0];
            });
        });
    };

    BMSP.EventBeforeAction.getEventsMetConditions = function(eventDataList, action, subject, targets) {
        return eventDataList.filter(function(eventData) {
            return this.meetsConditions(eventData['conditions'], action, subject, targets);
        }, this);
    };

    BMSP.EventBeforeAction.getBeforeUseSkillEvents = function(action, subject) {
        var eventDataList = this.getEventsMetConditions(this._beforeUseSkillEvents, action, subject, []);
        return eventDataList.map(function(eventData) { return eventData['id']; });
    };

    BMSP.EventBeforeAction.getBeforeInvokeActionEvents = function(action, subject, targets) {
        var eventDataList = this.getEventsMetConditions(this._beforeInvokeActionEvents, action, subject, targets);
        return eventDataList.map(function(eventData) { return eventData['id']; });
    };

    BMSP.EventBeforeAction.reserveCancelAction = function() {
        if(BattleManager._phase == 'eventBeforeUseSkill'){
            this.cancelAction = true;
        }
    };

    /*
     * Scene_Boot
     */
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        BMSP.requirePlugin('BMSP', 1.00);
        _Scene_Boot_start.call(this);
        BMSP.EventBeforeAction.init();
    };

    /*
     * Game_Battler
     */
    var _Game_Battler_initMembers = Game_Battler.prototype.initMembers;
    Game_Battler.prototype.initMembers = function() {
        _Game_Battler_initMembers.call(this);
        this._bmspStackResult = [];
    };

    Game_Battler.prototype.bmsp_stack_push_result = function() {
        this._bmspStackResult.push(this.result());
    };

    Game_Battler.prototype.bmsp_stack_pop_result = function() {
        this._result = this._bmspStackResult.pop();
    };

    var _Game_Battler_forceAction = Game_Battler.prototype.forceAction;
    Game_Battler.prototype.forceAction = function(skillId, targetIndex) {
        if(BMSP.EventBeforeAction.isEventBeforeActionPhase(BattleManager._phase)) {
            //強制アクション前の情報を保存
            BMSP.EventBeforeAction.stackForceActions.push({
                subject: BattleManager._subject,
                battler: this,
                actions: this._actions,
            });
        }
        _Game_Battler_forceAction.call(this, skillId, targetIndex);
    };

    /*
     * BattleManager
     */
    var _BattleManager_initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        _BattleManager_initMembers.call(this);
        BMSP.EventBeforeAction.initRuntime();
    };

    var _BattleManager_update = BattleManager.update;
    BattleManager.update = function() {
        if (!this.isBusy() && !this.updateEvent()) {
            switch (this._phase) {
                case 'eventBeforeUseSkill':
                    this.updateEventBeforeUseSkill();
                    break;
                case 'eventBeforeForcedUseSkill':
                    this.updateEventBeforeForcedUseSkill();
                    break;
                case 'eventBeforeInvokeAction':
                    this.updateEventBeforeInvokeAction();
                    break;
                case 'eventBeforeForcedInvokeAction':
                    this.updateEventBeforeForcedInvokeAction();
                    break;
            }
        }
        _BattleManager_update.call(this);
    };

    var _BattleManager_updateEvent = BattleManager.updateEvent;
    BattleManager.updateEvent = function() {
        if(BMSP.EventBeforeAction.isEventBeforeActionPhase(this._phase)) {
            if (this.isActionForced()) {
                this.processForcedActionBeforeAction();
                return true;
            } else {
                return this.updateEventMain();
            }
        }
        return _BattleManager_updateEvent.call(this);
    };

    var _BattleManager_processTurn = BattleManager.processTurn;
    BattleManager.processTurn = function() {
        var subject = this._subject;
        var action = subject.currentAction();
        if (action) {
            action.prepare();
            if (action.isValid()) {
                if (!(BMSP.getObjectId(action) in BMSP.EventBeforeAction.flagExecutedEventBeforeUseSkill)){
                    BMSP.EventBeforeAction.flagExecutedEventBeforeUseSkill[BMSP.getObjectId(action)] = true;
                    this.startEventBeforeUseSkill(action, subject);
                    return;
                }else{
                    delete BMSP.EventBeforeAction.flagExecutedEventBeforeUseSkill[BMSP.getObjectId(action)];
                }
            }
        }
        _BattleManager_processTurn.call(this);
        if(subject && action && action.isValid()){
            this.startEventBeforeInvokeAction(action, subject, this._targets);
        }
    };

    var _BattleManager_forceAction = BattleManager.forceAction;
    BattleManager.forceAction = function(battler) {
        //強制アクションバトラーの待避:行動前イベント中の上書き対応
        if(BMSP.EventBeforeAction.isEventBeforeActionPhase(this._phase)) {
            BMSP.EventBeforeAction.stackForcedBatterBeforeSetBattler.push(this._actionForcedBattler);
            this._actionForcedBattler = battler;
            return;
        }
        _BattleManager_forceAction.call(this, battler);
    };

    var _BattleManager_processForcedAction = BattleManager.processForcedAction;
    BattleManager.processForcedAction = function() {
        if (this._actionForcedBattler) {
            var subject = this._actionForcedBattler;
            var action = subject.currentAction();
            if (!(BMSP.getObjectId(action) in BMSP.EventBeforeAction.flagExecutedEventBeforeUseSkill)){
                BMSP.EventBeforeAction.flagExecutedEventBeforeUseSkill[BMSP.getObjectId(action)] = true;
                this.startEventBeforeForcedUseSkill(action, subject);
                return;
            }else{
                delete BMSP.EventBeforeAction.flagExecutedEventBeforeUseSkill[BMSP.getObjectId(action)];
            }
        }
        if(subject && action){
            _BattleManager_processForcedAction.call(this);
            this.startEventBeforeForcedInvokeAction(action, subject, this._targets);
        }
    };

    BattleManager.processForcedActionBeforeAction = function() {
        this.processForcedAction();
        //強制アクションバトラーの復帰:行動前イベント中の上書き対応
        this._actionForcedBattler = BMSP.EventBeforeAction.stackForcedBatterBeforeSetBattler.pop();
    };

    var _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        BMSP.EventBeforeAction.stackPhaseAction.push(this._phase);
        BMSP.EventBeforeAction.stackAction.push(this._action);
        BMSP.EventBeforeAction.stackTargets.push(this._targets);
        _BattleManager_startAction.call(this);
    };

    var _BattleManager_updateAction = BattleManager.updateAction;
    BattleManager.updateAction = function() {
        var target = this._targets.length > 0 ? this._targets[0] : null;
        if(target){
            this._subject.bmsp_stack_push_result();
            target.bmsp_stack_push_result();
        }
        _BattleManager_updateAction.call(this);
        if(target){
            this._subject.bmsp_stack_pop_result();
            target.bmsp_stack_pop_result();
        }
    };

    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var phase = BMSP.EventBeforeAction.stackPhaseAction.pop();
        this._action = BMSP.EventBeforeAction.stackAction.pop();
        this._targets = BMSP.EventBeforeAction.stackTargets.pop();
        switch (phase) {
            case 'eventBeforeUseSkill':
            case 'eventBeforeForcedUseSkill':
                _BattleManager_endAction.call(this);
                this._phase = phase;
                //待避した情報の復帰
                var action_info = BMSP.EventBeforeAction.stackForceActions.pop();
                this._subject = action_info['subject'];
                action_info['battler']._actions = action_info['actions'];
                break;
            case 'eventBeforeInvokeAction':
            case 'eventBeforeForcedInvokeAction':
                //スタックしたアクションがすべて終了バトラーなら終了状態へ
                var included_stack = BMSP.EventBeforeAction.stackForceActions.some(function(info) {
                    return BMSP.getObjectId(info['subject']) == BMSP.getObjectId(this._subject);
                }, this);
                if(!included_stack) {
                    this._subject.setActionState('done');
                }
                this._phase = phase;
                //待避した情報の復帰
                var action_info = BMSP.EventBeforeAction.stackForceActions.pop();
                this._subject = action_info['subject'];
                action_info['battler']._actions = action_info['actions'];
                break;
            default:
                _BattleManager_endAction.call(this);
                this._phase = phase;
                break;
        }
    };

    BattleManager.startEventBeforeUseSkill = function(action, subject) {
        BMSP.EventBeforeAction.stackPhaseUseSkill.push(this._phase);
        this._phase = 'eventBeforeUseSkill';
        event_ids = BMSP.EventBeforeAction.getBeforeUseSkillEvents(action, subject);
        BMSP.EventBeforeAction.stackEventList.push(event_ids);
    };

    BattleManager.updateEventBeforeUseSkill = function() {
        var event_ids = BMSP.EventBeforeAction.stackEventList[BMSP.EventBeforeAction.stackEventList.length-1];
        if (event_ids.length > 0){
            $gameTemp.reserveCommonEvent(event_ids.shift());
        }else{
            this.endEventBeforeUseSkill();
        }
    };

    BattleManager.endEventBeforeUseSkill = function() {
        BMSP.EventBeforeAction.stackEventList.pop();
        this._phase = BMSP.EventBeforeAction.stackPhaseUseSkill.pop();
        if(BMSP.EventBeforeAction.cancelAction) {
            this._subject.clearActions();
            BMSP.EventBeforeAction.cancelAction = false;
        }
    };

    BattleManager.startEventBeforeForcedUseSkill = function(action, subject) {
        //強制アクションバトラーの待避:行動前イベント中のアクション防止
        BMSP.EventBeforeAction.stackForcedBatterBeforeStartEvent.push(this._actionForcedBattler);
        this._actionForcedBattler = null;
        BMSP.EventBeforeAction.stackInpterpreter.push($gameTroop._interpreter);
        $gameTroop._interpreter = new Game_Interpreter();
        $gameTroop._interpreter.clear();
        BMSP.EventBeforeAction.stackPhaseForcedUseSkill.push(this._phase);
        this._phase = 'eventBeforeForcedUseSkill';
        event_ids = BMSP.EventBeforeAction.getBeforeUseSkillEvents(action, subject);
        BMSP.EventBeforeAction.stackEventList.push(event_ids);
    };

    BattleManager.updateEventBeforeForcedUseSkill = function() {
        var event_ids = BMSP.EventBeforeAction.stackEventList[BMSP.EventBeforeAction.stackEventList.length-1];
        if (event_ids.length > 0){
            $gameTemp.reserveCommonEvent(event_ids.shift());
        }else{
            this.endEventBeforeForcedUseSkill();
        }
    };

    BattleManager.endEventBeforeForcedUseSkill = function() {
        //強制アクションバトラーの復帰:行動前イベント中のアクション防止
        this._actionForcedBattler = BMSP.EventBeforeAction.stackForcedBatterBeforeStartEvent.pop();
        $gameTroop._interpreter = BMSP.EventBeforeAction.stackInpterpreter.pop();
        BMSP.EventBeforeAction.stackEventList.pop();
        this._phase = BMSP.EventBeforeAction.stackPhaseForcedUseSkill.pop();
    };

    BattleManager.startEventBeforeInvokeAction = function(action, subject, targets) {
        //通常コモンイベントの退避
        var reserved_event = $gameTemp.reservedCommonEvent()
        var reserved_event_id = 0;
        if (reserved_event) reserved_event_id = reserved_event.id;
        BMSP.EventBeforeAction.stackNormalCommonEvent.push(reserved_event_id);
        $gameTemp.clearCommonEvent();
        
        this._phase = 'eventBeforeInvokeAction';
        event_ids = BMSP.EventBeforeAction.getBeforeInvokeActionEvents(action, subject, targets);
        BMSP.EventBeforeAction.stackEventList.push(event_ids);
    };

    BattleManager.updateEventBeforeInvokeAction = function() {
        var event_ids = BMSP.EventBeforeAction.stackEventList[BMSP.EventBeforeAction.stackEventList.length-1];
        if (event_ids.length > 0){
            $gameTemp.reserveCommonEvent(event_ids.shift());
        }else{
            this.endEventBeforeInvokeAction();
        }
    };

    BattleManager.endEventBeforeInvokeAction = function() {
        BMSP.EventBeforeAction.stackEventList.pop();
        this._phase = 'action';
        
        //通常コモンイベントの復帰
        var event_id = BMSP.EventBeforeAction.stackNormalCommonEvent.pop();
        $gameTemp.reserveCommonEvent(event_id);
    };

    BattleManager.startEventBeforeForcedInvokeAction = function(action, subject, targets) {
        BMSP.EventBeforeAction.stackInpterpreter.push($gameTroop._interpreter);
        $gameTroop._interpreter = new Game_Interpreter();
        $gameTroop._interpreter.clear();
        this._phase = 'eventBeforeForcedInvokeAction';
        event_ids = BMSP.EventBeforeAction.getBeforeInvokeActionEvents(action, subject, targets);
        BMSP.EventBeforeAction.stackEventList.push(event_ids);
    };

    BattleManager.updateEventBeforeForcedInvokeAction = function() {
        var event_ids = BMSP.EventBeforeAction.stackEventList[BMSP.EventBeforeAction.stackEventList.length-1];
        if (event_ids.length > 0){
            $gameTemp.reserveCommonEvent(event_ids.shift());
        }else{
            this.endEventBeforeForcedInvokeAction();
        }
    };

    BattleManager.endEventBeforeForcedInvokeAction = function() {
        $gameTroop._interpreter = BMSP.EventBeforeAction.stackInpterpreter.pop();
        BMSP.EventBeforeAction.stackEventList.pop();
        this._phase = 'action';
    };

    /*
     * Window_BattleLog
     */
    var _Window_BattleLog_clear = Window_BattleLog.prototype.clear;
    Window_BattleLog.prototype.clear = function() {
        //行動前イベント中なら何もしない
        var phase_length = BMSP.EventBeforeAction.stackPhaseAction.length;
        if(phase_length > 0){
            var phase = BMSP.EventBeforeAction.stackPhaseAction[phase_length-1];
            if(BMSP.EventBeforeAction.isEventBeforeActionPhase(phase)) {
                return;
            }
        }
        _Window_BattleLog_clear.call(this);
    };

    var _Window_BattleLog_pushBaseLine = Window_BattleLog.prototype.pushBaseLine;
    Window_BattleLog.prototype.pushBaseLine = function() {
        //行動前イベント中なら何もしない
        var phase_length = BMSP.EventBeforeAction.stackPhaseAction.length;
        if(phase_length > 0){
            var phase = BMSP.EventBeforeAction.stackPhaseAction[phase_length-1];
            if(BMSP.EventBeforeAction.isEventBeforeActionPhase(phase)) {
                return;
            }
        }
        _Window_BattleLog_pushBaseLine.call(this);
    };

    var _Window_BattleLog_popBaseLine = Window_BattleLog.prototype.popBaseLine;
    Window_BattleLog.prototype.popBaseLine = function() {
        //行動前イベント中なら何もしない
        var phase_length = BMSP.EventBeforeAction.stackPhaseAction.length;
        if(phase_length > 0){
            var phase = BMSP.EventBeforeAction.stackPhaseAction[phase_length-1];
            if(BMSP.EventBeforeAction.isEventBeforeActionPhase(phase)) {
                return;
            }
        }
        _Window_BattleLog_pushBaseLine.call(this);
    };

})();
