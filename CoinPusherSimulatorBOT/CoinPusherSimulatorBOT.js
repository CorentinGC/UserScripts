// ==UserScript==
// @name         CoinPusherBot
// @namespace    https://corentingc.fr
// @version      0.5
// @description  Play to CoinPusherSimulator
// @author       CorentinGC
// @match        https://www.twitch.tv/coinpushersimulator
// @grant        nonegit remote add origin git@github.com:CorentinGC/userscripts.git

// @updateURL    https://raw.githubusercontent.com/CorentinGC/UserScripts/main/CoinPusherSimulatorBOT/CoinPusherSimulatorBOT.js
// @downloadURL  https://raw.githubusercontent.com/CorentinGC/UserScripts/main/CoinPusherSimulatorBOT/CoinPusherSimulatorBOT.js
// ==/UserScript==

const VERSION = '0.5'
const DEFAULT_TIMER = 10
const KEY_BOT_TIMER = 'bot_timer'

const CHAT_INPUT = 'textarea[data-a-target=chat-input]'
const CHAT_BTN = 'button[data-a-target=chat-send-button]'
const BONUS_CHEST = 'span[data-a-target=tw-core-button-label-text]'


class CoinPusher{
    constructor(){
        this.UI_style()
        this.UI_events()
        this.UI()
        
    }
    started = false
    bet = 100
    nextTime = new Date().toLocaleTimeString()
    timeout
    timer = parseFloat(localStorage.getItem(KEY_BOT_TIMER)) || DEFAULT_TIMER


    start(){
        if(this.started) return

        this.log('Bot started')

        this.started = true
        this.loop()
    }
    stop(){
        if(!this.started) return

        this.log('Bot stopped')

        this.started = false
        clearTimeout(this.timeout)
        this.UI_updateNextBet()
    }
    changeInput(value=100){
        let input = document.querySelector(CHAT_INPUT);
        let lastValue = input.value
        input.value = value
        let event = new Event('input', { bubbles: true })

        // hack React15
        event.simulated = true
        // hack React16 内部定义了descriptor拦截value，此处重置状态
        let tracker = input._valueTracker
        if (tracker) tracker.setValue(lastValue)
        input.dispatchEvent(event)
    }
    clickBtn(){
        let button = document.querySelector(CHAT_BTN)
        button.click()
    }
    sendToChat(msg){
        this.changeInput(msg)
        this.clickBtn()
    }
    changeTimer(min){
        this.timer = parseFloat(min)
        localStorage.setItem(KEY_BOT_TIMER, min)

        this.log('Timer changed to '+min+' minutes')
    }
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    log(msg){
        const date = new Date().toLocaleTimeString()
        const prefix = '['+date+'][CoinPusher] -> '
        return console.log(prefix+msg)
    }
    UI_style(){
        var style = document.createElement('style')
        style.innerHTML =
        `
            #twitchbot {
                z-index: 999;
                background: white;
                height: 40px;
                min-width: 150px;
                position: fixed;
                bottom: 0;
                left: 0;
                border-top: 1px solid black;
                border-right: 1px solid black;
                border-top-right-radius: .25em;
                display: flex;
                justify-content: center;
                align-items: center;
                color: black;
                padding: 0 5px;
            }

            #start-bot, #stop-bot, #change-timer-bot{
                display: inline-block;
                font-weight: 400;
                text-align: center;
                white-space: nowrap;
                vertical-align: middle;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                border: 1px solid transparent;
                padding: .375rem .75rem;
                font-size: 1rem;
                line-height: 1.5;
                border-radius: .25rem;
                transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                margin: 0 5px;
            }
            #start-bot, #change-timer-bot {
                color: #fff;
                background-color: #28a745;
                border-color: #28a745;
            }
            #stop-bot {
                color: #fff;
                background-color: #dc3545;
                border-color: #dc3545;
            }
            #timer-bot {
                width: 50px;
                border-radius: .25em;
            }

        `

        document.head.appendChild(style)
    }
    UI_events(){
        document.addEventListener('click', event => {
            switch(event.target.id){
                case 'start-bot':
                    return this.start()

                case 'stop-bot':
                    return this.stop()

                case 'change-timer-bot':
                    let newTimer = document.querySelector('#timer-bot').value
                    return this.changeTimer(newTimer)
            }
        })
    }
    UI(){
        let container = document.createElement("div")
        container.id = 'twitchbot'

        let content = document.createTextNode('CoinPusher v'+VERSION)
        container.appendChild(content)

        let startBtn = document.createElement("button")
        startBtn.id = 'start-bot'
        startBtn.innerHTML = 'Start'
        container.appendChild(startBtn)

        let stopBtn = document.createElement("button")
        stopBtn.id = 'stop-bot'
        stopBtn.innerHTML  = 'Stop'
        container.appendChild(stopBtn)

        let nextBet = document.createElement('span')
        nextBet.id = 'nextbet'
        nextBet.innerHTML = 'Bot stopped'
        container.appendChild(nextBet)

        let separator = document.createTextNode(' | ')
        container.appendChild(separator)

        let timer = document.createElement('input')
        timer.id = 'timer-bot'
        timer.value = this.timer
        container.appendChild(timer)

        let timerBtn = document.createElement("button")
        timerBtn.id = 'change-timer-bot'
        timerBtn.innerHTML  = 'Modify'
        container.appendChild(timerBtn)

        document.body.append(container)
    }
    UI_updateNextBet(nextTime=false){
        let nextBet = document.getElementById('nextbet')
        nextBet.innerHTML = !nextTime ?  'Bot stopped' : 'Next bet: '+nextTime
    }
    randTimer(){
        let entropy =  this.getRandomInt(10,100) / 10
        let timer = Math.round( (this.timer + entropy) * 60 * 1000)

        console.log(this.timer, entropy, this.timer+entropy)
        return timer
    }
    loop(){
        if(!this.started) return this.log('Bot not started')

        this.sendToChat(this.bet)

        let timer = this.randTimer()
        this.nextTime = new Date(new Date().getTime() + timer).toLocaleTimeString() 
        this.log('Loop done ! Next bet at: '+this.nextTime)

        this.UI_updateNextBet(this.nextTime)

        this.timeout = setTimeout(() => {
            this.loop()
        }, timer)
    }
}

Bot = new CoinPusher()