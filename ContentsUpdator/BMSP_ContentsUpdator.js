//=============================================================================
// BMSP_ContentsUpdator.js (表示領域更新)
//=============================================================================

/*:
 * @plugindesc ウインドウの指定領域の表示内容を切り替える機能を提供します。
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
 * @help
 * 使用方法:
 *   ウインドウの指定領域の表示内容をアニメーションで任意にまたは自動で切り替える機能を提供します。
 *   このプラグインは開発者向けで単体では表示上の効果はありません。
 *   以下では基本的な使い方のみ説明しますので、詳細はコードおよびContentsUpdatorを利用したプラグインのコードをご覧下さい。
 * 
 * ●構造
 *   ウインドウ内容の更新領域は以下の様な構造になっています。
 *   @ Window
 *   @  |- AreaManager
 *   @  |- Area
 *   @  |   |- Panel1
 *   @  |   |- Panel2
 *   @  |   |   :
 *   @  |   |- Paneln
 *   @  |- Area
 *   @  |   :
 *   @  |- Area
 *   @      |- Panel1
 *   @      |- Panel2
 *   @      |   :
 *   @      |- Paneln
 *
 * ●AreaManager
 *   更新領域を管理するSpriteです。AreaManagerは複数の更新領域を持つことが出来ます。
 *   ウインドウインスタンスwindowに対してwindow.areaManagerで参照できます。
 *     ・registerUpdateArea(name, x, y, width, height)
 *       Windowコンテンツの指定領域にnameという名前にUpdateAreaを登録しそのUpdateAreaを返します。
 *       nameが登録済みの場合は、そのUpdateAreaを返します。
 *     ・registerAutoUpdateArea(name, x, y, width, height)
 *       Windowコンテンツの指定領域にnameという名前のAutoUpdateAreaを登録しそのAutoUpdateAreaを返します。
 *       nameが登録済みの場合は、そのAutoUpdateAreaを返します。
 *       UpdateAreaと名前空間を共有する点に注意して下さい。
 *     ・unregister(name)
 *       nameという名前の(Auto)UpdateAreaを削除します。
 **
 * ●UpdateArea
 *   更新領域のSpriteです。UpdateAreaは順序付きのPanelを複数持つことが出来ます。
 *   UpdateAreaは現在の表示Panelと次(または前)のPanelへの進捗(proress)情報を保持します。
 *   この2つの情報を更新することで複数のPanelの表示をアニメーションさせながら切り替えることが出来ます。
 *     ・active = true
 *       falseのときアニメーションが更新されなくなります。
 *     ・lazy = false
 *       trueの時、遅延更新モードになります。
 *     ・setAnimationType(name)
 *       アニメーションのタイプをセットします。
 *     ・addPanel(name)
 *       nameという名前のPanelを末尾に追加しそのPanelを返します。nameというPanelがすでに存在する場合は追加せずにそのPanelを返します。
 *       PanelにはUpdateAreaと同じサイズの空のbitmapが登録されるので、このbitmapに切り替えたい表示内容を描画します。
 *     ・removePanel(name)
 *       nameという名前のPanelを削除します。
 *     ・setProgress(value, min = -100, max = 100)
 *       現在表示中のPanelに対する進捗をセットします。値は0%を中心に次のPanelまでの100%、前のPanelまでの-100%を指定出来ます。
 *       引数でmin、maxを指定することで進捗のセット値に制限を掛けることが出来ます。
 *     ・setIndex(value)
 *       現在表示中のPanel番号をセットします。これを更新すると進捗も0にセットされます。
 *     ・lazyCommit()
 *       遅延更新モードの時、Panelの更新を表示に反映します。
 **
 * ●AutoUpdateArea
 *   自動更新領域のSpriteです。UpdateAreaに自動で表示内容を切り替えていく機能を加えたクラスです。
 *     ・playing = true
 *       activeと異なり、falseのとき次のパネルへの進行がとまります。進捗中のアニメーションは停止しません。
 *     ・setWaitDuration(value)
 *       パネル1枚ごとの待機フレームをセットします。
 *     ・setAnimationDuration(value)
 *       切り替えアニメーションにかけるフレーム数です。
 **
 * ●Panel
 *   更新領域の表示内容のSpriteです。Panel1枚につき表示内容1つを描画し、2枚以上のPanelを更新領域に登録することで表示内容を切り替えます。
 *     ・syncFontSettings()
 *       Windowの現在のフォント設定をPanelに反映します。
 *       反映されるのはfontFace,fontItalic,fontSizeです。
 *     ・syncDrawSettings()
 *       Windowの現在の描画設定をPanelに反映します。
 *       反映されるのはtextColor,paintOpacity,outlineWidthです。
 **
 * ●アニメーションの定義
 *   アニメーションタイプはBMSP.ContentsUpdator.animationsオブジェクトのプロパティとして定義します。
 *   各アニメーションタイプは進捗が0%の時の現在のPanel単体の表示処理single関数、
 *   進捗が0～100%の時の現在のPanelと次のPanelの表示処理next関数、
 *   進捗が0～-100%の時の現在のPanelと前のPanelの表示処理prev関数が定義されている必要があります。
 *   各種表示処理関数が呼び出される前、すべてのPanelに以下の初期化処理が行われます。
 *     panel.visible = false
 *     panel.opacity = 255
 *     panel.move(0,0)
 *     panel.setFrame(0, 0, area.width, area.height)
 *   各種表示処理では進捗に応じてPanelの表示状態・位置を設定してください。
 *     ・single(progress, nowPanel, area)
 *       進捗0%の処理内容
 *     ・next(progress, nowPanel, nextPanel, area)
 *       進捗0～100%の処理内容
 *     ・prev(progress, nowPanel, prevPanel, area)
 *       進捗0～-100%の処理内容
 **
 *   デフォルトではfade,slideUp,slideDown,slideRight,slideLeftの4つが定義されているので参考にしてください。
 *
 * ●遅延更新
 *   (Auto)UpdateAreaのプロパティlazyをtrueにすると、遅延更新モードになります。
 *   遅延更新モードではPanelの登録・削除処理を行ってもすぐに反映されなくなります。
 *   行った変更を表示に反映するにはlazyCommit()関数を呼び出します。
 *   また、AutoUpdateAreaではアニメーションが終了したタイミングでlazyCommit()が自動で呼び出されます。
 *   遅延更新はアニメーション中にPanelの追加削除が発生しアニメーションが途切れたりすることを防止できます。
 */


(function () {

    /*
     * プラグインバージョン
     */
    PluginManager.setVersion('BMSP_ContentsUpdator', 1.01);
    
    /*
     * 必須プラグインチェック
     */
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        BMSP.requirePlugin('BMSP', 1.10);
        _Scene_Boot_start.call(this);
    };

    /*
     * ContentsUpdator
     */
    BMSP.ContentsUpdator = function () {
        throw new Error('This is a static class');
    };
    
    //初期値
    BMSP.ContentsUpdator.defaultAnimationType = 'slideUp';
    BMSP.ContentsUpdator.defaultAnimationDuration = 60;
    BMSP.ContentsUpdator.defaultWaitDuration = 120;
    
    //アニメーション定義
    BMSP.ContentsUpdator.animations = {};
    var animations = BMSP.ContentsUpdator.animations;
    animations.fade = { //クロスフェード
        single: function (progress, nowPanel, area) {
            nowPanel.visible = true;
        },
        next: function (progress, nowPanel, nextPanel, area) {
            nowPanel.visible = true;
            nextPanel.visible = true;
            nowPanel.opacity = 255 * (100 - progress) / 100;
            nextPanel.opacity = 255 * progress / 100;
        },
        prev : function (progress, nowPanel, prevPanel, area) {
            nowPanel.visible = true;
            prevPanel.visible = true;
            nowPanel.opacity = 255 * (100 + progress) / 100;
            prevPanel.opacity = 255 * -progress / 100;
        },
    };
    animations.slideLeft = { //左スライド
        single: function (progress, nowPanel, area) {
            nowPanel.visible = true;
            nowPanel.opacity = 255;
        },
        next: function (progress, nowPanel, nextPanel, area) {
            var shift = area.width * progress / 100;
            nowPanel.visible = true;
            nextPanel.visible = true;
            nowPanel.x = 0;
            nowPanel.setFrame(shift, 0, area.width - shift, area.height);
            nextPanel.x = area.width - shift;
            nextPanel.setFrame(0, 0, shift, area.height);
        },
        prev : function (progress, nowPanel, prevPanel, area) {
        },
    };
    animations.slideRight = { //右スライド
        single: function (progress, nowPanel, area) {
            nowPanel.visible = true;
            nowPanel.opacity = 255;
        },
        next: function (progress, nowPanel, nextPanel, area) {
            var shift = area.width * progress / 100;
            nowPanel.visible = true;
            nextPanel.visible = true;
            nowPanel.x = shift;
            nowPanel.setFrame(0, 0, area.width - shift, area.height);
            nextPanel.x = 0;
            nextPanel.setFrame(area.width - shift, 0, shift, area.width);
        },
        prev : function (progress, nowPanel, prevPanel, area) {
        },
    };
    animations.slideDown = { //下スライド
        single: function (progress, nowPanel, area) {
            nowPanel.visible = true;
            nowPanel.opacity = 255;
        },
        next: function (progress, nowPanel, nextPanel, area) {
            var shift = area.height * progress / 100;
            nowPanel.visible = true;
            nextPanel.visible = true;
            nowPanel.y = shift;
            nowPanel.setFrame(0, 0, area.width, area.height - shift);
            nextPanel.y = 0;
            nextPanel.setFrame(0, area.height - shift, area.width, shift);
        },
        prev : function (progress, nowPanel, prevPanel, area) {
            var shift = area.height * progress / 100;
            nowPanel.visible = true;
            prevPanel.visible = true;
            nowPanel.y = 0;
            nowPanel.setFrame(0, shift, area.width, area.height - shift);
            prevPanel.y = area.height - shift;
            prevPanel.setFrame(0, 0, area.width, shift);
        },
    };
    animations.slideUp = { //上スライド
        single: function (progress, nowPanel, area) {
            nowPanel.visible = true;
            nowPanel.opacity = 255;
        },
        next: function (progress, nowPanel, nextPanel, area) {
            var shift = area.height * progress / 100;
            nowPanel.visible = true;
            nextPanel.visible = true;
            nowPanel.y = 0;
            nowPanel.setFrame(0, shift, area.width, area.height - shift);
            nextPanel.y = area.height - shift;
            nextPanel.setFrame(0, 0, area.width, shift);
        },
        prev : function (progress, nowPanel, prevPanel, area) {
            var shift = area.height * progress / 100;
            nowPanel.visible = true;
            prevPanel.visible = true;
            nowPanel.y = shift;
            nowPanel.setFrame(0, 0, area.width, area.height - shift);
            prevPanel.y = 0;
            prevPanel.setFrame(0, area.height - shift, area.width, shift);
        },
    };
    
    /*
     * Panel
     */
    BMSP.ContentsUpdator.Panel = function () {
        this.initialize.apply(this, arguments);
    };
    var Panel = BMSP.ContentsUpdator.Panel;
    Panel.prototype = Object.create(Sprite.prototype);
    Panel.prototype.construnctor = Panel;
    
    Panel.prototype.initialize = function (area) {
        var width = area.width;
        var height = area.height;
        var bitmap = new Bitmap(width, height);
        Sprite.prototype.initialize.call(this, bitmap);
        this.area = area;
    };
    
    Panel.prototype.syncFontSettings = function () {
        var parent = this.area.manager.window.contents;
        this.bitmap.fontFace = parent.fontFace;
        this.bitmap.fontItalic = parent.fontItalic;
        this.bitmap.fontSize = parent.fontSize;
    };
    
    Panel.prototype.syncDrawSettings = function () {
        var parent = this.area.manager.window.contents;
        this.bitmap.textColor = parent.textColor;
        this.bitmap.paintOpacity = parent.paintOpacity;
        this.outlineWidth = parent.outlineWidth;
    }
    
    /*
     * UpdateArea
     */
    BMSP.ContentsUpdator.UpdateArea = function () {
        this.initialize.apply(this, arguments);
    };
    var UpdateArea = BMSP.ContentsUpdator.UpdateArea;
    UpdateArea.prototype = Object.create(Sprite.prototype);
    UpdateArea.prototype.construnctor = UpdateArea;
    
    UpdateArea.prototype.initialize = function (manager, rect) {
        Sprite.prototype.initialize.call(this);
        this.move(rect.x, rect.y);
        this.setFrame(0, 0, rect.width, rect.height);
        this.manager = manager;
        this._names = [];
        this._panels = {};
        this._buffer_names = [];
        this._buffer_panels = {};
        this._animationType = BMSP.ContentsUpdator.defaultAnimationType;
        this._progress = 0;
        this._index = -1;
        this.lazy = false;
        this.active = true;
    };
    
    UpdateArea.prototype.getAnimationType = function () {
        return this._animationType;
    };
    
    UpdateArea.prototype.setAnimationType = function (type) {
        this._animationType = type;
    };
    
    UpdateArea.prototype.addPanel = function (name, through_buffer) {
        var names = this._names;
        var panels = this._panels;
        if (this.lazy && !through_buffer) {
            names = this._buffer_names;
            panels = this._buffer_panels;
        }
        if (names.indexOf(name) >= 0) {
            return panels[name];
        }
        var panel = new Panel(this);
        if (!this.lazy || through_buffer) this.addChild(panel);
        names.push(name);
        panels[name] = panel;
        return panel;
    };
    
    UpdateArea.prototype.removePanel = function (name, through_buffer) {
        var names = this._names;
        var panels = this._panels;
        if (this.lazy && !through_buffer) {
            names = this._buffer_names;
            panels = this._buffer_panels;
        }
        if (names.indexOf(name) == -1) {
            return;
        }
        if (!this.lazy || !through_buffer) this.removeChild(this._panels[name]);
        delete panels[name];
        for (var i=0; i<names.length; i++) {
            if (names[i] == name) {
                if (!this.lazy && this._index >= i) this.setIndex(this._index - 1);
                names.splice(i,1);
                break;
            }
        }
    };
    
    UpdateArea.prototype.removeAllPanels = function (through_buffer) {
        if (!this.lazy || through_buffer) {
            for (var i=0; i<this._names.length; i++) {
                this.removeChild(this._panels[this._names[i]]);
            }
            this._names = [];
            this._panels = {};
        } else {
            this._buffer_names = [];
            this._buffer_panels = {};
        }
        if (!this.lazy || through_buffer) this.setIndex(-1);
    };
    
    UpdateArea.prototype.getPanel = function (name, through_buffer) {
        var names = this._names;
        var panels = this._panels;
        if (this.lazy && !through_buffer) {
            names = this._buffer_names;
            panels = this._buffer_panels;
        }
        if (names.indexOf(name) >= 0) {
            return panels[name];
        }
        return null;
    };
    
    UpdateArea.prototype.getPanelAmount = function (through_buffer) {
        var names = this._names;
        if (this.lazy && !through_buffer) {
            names = this._buffer_names;
        }
        return names.length;
    };
    
    UpdateArea.prototype.getPanelName = function (index, through_buffer) {
        var names = this._names;
        if (this.lazy && !through_buffer) {
            names = this._buffer_names;
        }
        if (index >= names.length) return '';
        return names[index];
    }
    
    UpdateArea.prototype.getPanelNames = function (through_buffer) {
        var names = this._names;
        if (this.lazy && !through_buffer) {
            names = this._buffer_names;
        }
        return names;
    };
    
    UpdateArea.prototype.getProgress = function () {
        return this._progress;
    };
    
    UpdateArea.prototype.setProgress = function (value, min, max) {
        if (min === undefined) min = -100;
        if (max === undefined) max = 100;
        if (value > max) value = max;
        if (value < min) value = min;
        this._progress = value;
    };
    
    UpdateArea.prototype.getIndex = function () {
        return this._index;
    };
    
    UpdateArea.prototype.setIndex = function (value) {
        if (this._names.length == 0) {
            this._index = -1;
            this.setProgress(0);
            return;
        }
        var index = BMSP.rubyLikeMod(value, this._names.length);
        if (index != this._index) {
            this._index = index;
            this.setProgress(0);
        }
    };
    
    UpdateArea.prototype.clear = function () {
        this.children.forEach(function (panel) {
            panel.visible = false;
            panel.opacity = 255;
            panel.move(0, 0);
            panel.setFrame(0, 0, this.width, this.height);
        }, this);
    };
    
    UpdateArea.prototype.lazyCommit = function () {
        if (this._names.toString() == this._buffer_names.toString()) return;
        this.removeChildren();
        this._names = BMSP.shallowCopy(this._buffer_names);
        this._panels = BMSP.shallowCopy(this._buffer_panels);
        for (var i=0; i<this._names.length; i++) {
            var panel = this._panels[this._names[i]];
            this.addChild(panel);
        }
        if (this._index >= this._names.length) {
            this.setIndex(-1);
        }
        if (this._index >= 0) {
            UpdateArea.prototype.updateAnimation.call(this);
        }
    };
    
    UpdateArea.prototype.setFirstView = function () {
        this.setIndex(0);
        this.setProgress(0);
        this.updateAnimation();
    };
    
    UpdateArea.prototype.update = function () {
        Sprite.prototype.update.call(this);
        if (this._index == -1) {
            this.setFirstView();
        }
        if (!this.active) return;
        this.updateAnimation();
    };
    
    UpdateArea.prototype.updateAnimation = function () {
        if (this._names.length == 0) return;
        this.clear();
        var nowPanel = this.getNowPanel();
        if (this._names.length == 1) {
            var animationFunc = BMSP.ContentsUpdator.animations[this._animationType].single;
            animationFunc(this._progress, nowPanel, this);
        } else if (this._progress >= 0) {
            var nextPanel = this.getNextPanel();
            var animationFunc = BMSP.ContentsUpdator.animations[this._animationType].next;
            animationFunc(this._progress, nowPanel, nextPanel, this);
        } else if (this._progress < 0) {
            var prevPanel = this.getPrevPanel();
            var animationFunc = BMSP.ContentsUpdator.animations[this._animationType].prev;
            animationFunc(-this._progress, nowPanel, prevPanel, this);
        }
    };
    
    UpdateArea.prototype.getNowName = function () {
        if (this._index == -1) return '';
        var index = BMSP.rubyLikeMod(this._index, this._names.length);
        return this._names[index];
    };
    
    UpdateArea.prototype.getNextName = function () {
        if (this._index == -1) return '';
        var index = BMSP.rubyLikeMod(this._index+1, this._names.length);
        return this._names[index];
    };
    
    UpdateArea.prototype.getPrevName = function () {
        if (this._index == -1) return '';
        var index = BMSP.rubyLikeMod(this._index-1, this._names.length);
        return this._names[index];
    };
    
    UpdateArea.prototype.getNowPanel = function () {
        return this.getPanel(this.getNowName(), true);
    };
    
    UpdateArea.prototype.getNextPanel = function () {
        return this.getPanel(this.getNextName(), true);
    };
    
    UpdateArea.prototype.getPrevPanel = function () {
        return this.getPanel(this.getPrevName(), true);
    };
    
    /*
     * AutoUpdateArea
     */
    BMSP.ContentsUpdator.AutoUpdateArea = function () {
        this.initialize.apply(this, arguments);
    };
    var AutoUpdateArea = BMSP.ContentsUpdator.AutoUpdateArea;
    AutoUpdateArea.prototype = Object.create(UpdateArea.prototype);
    AutoUpdateArea.prototype.construnctor = AutoUpdateArea;
    
    AutoUpdateArea.prototype.initialize = function (manager, rect) {
        UpdateArea.prototype.initialize.call(this, manager, rect);
        this.playing = true;
        this._phase = 'start';
        this._waitCount = 0;
        this._animationCount = 0;
        this._waitDuration = BMSP.ContentsUpdator.defaultWaitDuration;
        this._animationDuration = BMSP.ContentsUpdator.defaultAnimationDuration;
    };
    
    AutoUpdateArea.prototype.getWaitDuration = function () {
        return this._waitDuration;
    };
    
    AutoUpdateArea.prototype.setWaitDuration = function (value) {
        if (value < 0) value = 0;
        this._waitDuration = value;
    };
    
    AutoUpdateArea.prototype.getAnimationDuration = function () {
        return this._animationDuration;
    };
    
    AutoUpdateArea.prototype.setAnimationDuration = function (value) {
        if (value < 0) value = 0;
        this._animationDuration = value;
    };
    
    AutoUpdateArea.prototype.isPhaseStart = function () {
        return this._phase == 'start';
    };
    
    AutoUpdateArea.prototype.isPhaseWait = function () {
        return this._phase == 'wait';
    };
    
    AutoUpdateArea.prototype.isPhaseAnimation = function () {
        return this._phase == 'animation';
    };
    
    AutoUpdateArea.prototype.setFirstView = function () {
        this.setIndex(0);
        this.setProgress(0);
        UpdateArea.prototype.updateAnimation.call(this);
    };
    AutoUpdateArea.prototype.updateAnimation = function () {
        switch (this._phase) {
            case 'start':
                this.updatePhaseStart();
                break;
            case 'wait':
                this.updatePhaseWait();
                break;
            case 'animation':
                this.updatePhaseAnimation();
                break;
        }
    };
    
    AutoUpdateArea.prototype.updatePhaseStart = function () {
        this.startPhaseWait();
    };
    
    AutoUpdateArea.prototype.startPhaseWait = function () {
        if (this.lazy) {
            this.lazyCommit();
        }
        this._waitCount = 0;
        this._phase = 'wait';
        this.updatePhaseWait();
    };
    
    AutoUpdateArea.prototype.updatePhaseWait = function () {
        if (!this.playing) return;
        if (this._waitCount++ >= this._waitDuration) {
            this.endPhaseWait();
        }
    };
    
    AutoUpdateArea.prototype.endPhaseWait = function () {
        this.startPhaseAnimation();
    };
    
    AutoUpdateArea.prototype.startPhaseAnimation = function () {
        this._animationCount = 0;
        this._phase = 'animation';
        this.updatePhaseAnimation();
    };
    
    AutoUpdateArea.prototype.updatePhaseAnimation = function () {
        if (this._animationCount++ >= this._animationDuration) {
            this.endPhaseAnimation();
            return;
        }
        this.updateProgress();
        UpdateArea.prototype.updateAnimation.call(this);
    };
    
    AutoUpdateArea.prototype.endPhaseAnimation = function () {
        this.setProgress(100);
        UpdateArea.prototype.updateAnimation.call(this);
        this.setIndex(this.getIndex()+1);
        this.startPhaseWait();
    };
    
    AutoUpdateArea.prototype.updateProgress = function () {
        this.setProgress(100 * this._animationCount / this._animationDuration);
    };
    
    /*
     * AreaManager
     */
    BMSP.ContentsUpdator.AreaManager = function () {
        this.initialize.apply(this, arguments);
    };
    var AreaManager = BMSP.ContentsUpdator.AreaManager;
    AreaManager.prototype = Object.create(Sprite.prototype);
    AreaManager.prototype.construnctor = AreaManager;
    
    AreaManager.prototype.initialize = function (window) {
        Sprite.prototype.initialize.call(this);
        this.window = window;
        this.window._windowContentsSprite.addChild(this);
        this._names = [];
        this._areas = {};
    };
    
    UpdateArea.prototype.getAreaNames = function () {
        return this._areas;
    };
    
    AreaManager.prototype.register = function (name, area) {
        this._names.push(name);
        this._areas[name] = area;
        this.addChild(area);
    };
    
    AreaManager.prototype.registerUpdateArea = function (name, x, y, width, height) {
        if (this._names.indexOf(name) >= 0) return this._areas[name];
        var rect = new Rectangle(x, y, width, height);
        var area = new UpdateArea(this, rect);
        this.register(name, area);
        return area;
    };
    
    AreaManager.prototype.registerAutoUpdateArea = function (name, x, y, width, height) {
        if (this._names.indexOf(name) >= 0) return this._areas[name];
        var rect = new Rectangle(x, y, width, height);
        var area = new AutoUpdateArea(this, rect);
        this.register(name, area);
        return area;
    };
    
    AreaManager.prototype.getArea = function (name) {
        if (this._names.indexOf(name) >= 0) {
            return this._areas[name];
        }
        return null;
    };
    
    AreaManager.prototype.unregister = function (name) {
        if (this._names.indexOf(name) == -1) {
            return;
        }
        this.removeChild(this._areas[name]);
        delete this._areas[name];
        for (var i=0; i<this._names.length; i++) {
            if (this._names[i] == name) {
                this._names.splice(i,1);
                break;
            }
        }
    };
    
    AreaManager.prototype.unregisterAll = function () {
        for (var i=0; i<this._names.length; i++) {
            this.removeChild(this._areas[this._names[i]]);
        }
        this._names = [];
        this._areas = {};
    };
    
    /*
     * Window_Base
     */
    var _Window_Base_initialize = Window_Base.prototype.initialize;
    Window_Base.prototype.initialize = function (x, y, width, height) {
        _Window_Base_initialize.call(this, x, y, width, height);
        this.areaManager = new AreaManager(this);
    };
    
    var _Window_Base_update = Window_Base.prototype.update;
    Window_Base.prototype.update = function () {
        _Window_Base_update.call(this);
        this.areaManager.update();
    };
    
})();