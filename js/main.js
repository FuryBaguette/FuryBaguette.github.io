"use strict";

/**
 * Configs
 */
var configs = (function () {
    var instance;
    var Singleton = function (options) {
        var options = options || Singleton.defaultOptions;
        for (var key in Singleton.defaultOptions) {
            this[key] = options[key] || Singleton.defaultOptions[key];
        }
    };
    Singleton.defaultOptions = {
        general_help: "Below there's a list of commands that you can use.\nYou can use autofill by pressing the TAB key, autocompleting if there's only 1 possibility, or showing you a list of possibilities.",
        repos_help: "List my Github repositories.",
        github_help: "Open my github page.",
        donate_help: "Open donation website",
        whoami_help: "Information about me.",
        date_help: "Print the system date and time.",
        help_help: "Print this menu.",
        clear_help: "Clear the terminal screen.",
        welcome: "Welcome to FuryBaguette's website!\nIf you're part of the linux master race or you have time to waste, execute the 'help' command, otherwise, use the noob friendly menu at the top.",
        internet_explorer_warning: "NOTE: I see you're using internet explorer, this website won't work properly.",
        welcome_file_name: "welcome_message.txt",
        invalid_command_message: "<value>: command not found.",
        permission_denied_message: "Unable to '<value>', permission denied.",
        usage: "Usage",
        file: "file",
        file_not_found: "File '<value>' not found.",
        username: "Username",
        hostname: "Host",
        platform: "Platform",
        accesible_cores: "Accessible cores",
        language: "Language",
        value_token: "<value>",
        host: "furybaguette.me",
        user: "guest",
        is_root: false,
        donate_url: "http://buymeacoff.ee/FuryBaguette",
        github_url: "https://github.com/FuryBaguette",
        type_delay: 0
    };
    return {
        getInstance: function (options) {
            instance === void 0 && (instance = new Singleton(options));
            return instance;
        }
    };
})();

var commands = (function () {
    var instance;
    var Singleton = function (options) {
        var options = options || Singleton.defaultOptions;
        for (var key in Singleton.defaultOptions) {
            this[key] = options[key] || Singleton.defaultOptions[key];
        }
    };
    Singleton.defaultOptions = {
        "repos": "repos",
        "github": "github",
        "donate": "donate",
        "date": "date",
        "help": "help",
        "clear": "clear",
        "whoami": "whoami"
    };
    return {
        getInstance: function (options) {
            instance === void 0 && (instance = new Singleton(options));
            return instance;
        }
    };
})();

var main = (function () {
    /**
     * Aux functions
     */
    var isUsingIE = window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);

    var ignoreEvent = function (event) {
        event.preventDefault();
        event.stopPropagation();
    };
    
    var scrollToBottom = function () {
        window.scrollTo(0, document.body.scrollHeight);
    };
    
    var isURL = function (str) {
        return (str.startsWith("http") || str.startsWith("www")) && str.indexOf(" ") === -1 && str.indexOf("\n") === -1;
    };
    
    /**
     * Model
     */
    var InvalidArgumentException = function (message) {
        this.message = message;
        // Use V8's native method if available, otherwise fallback
        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(this, InvalidArgumentException);
        } else {
            this.stack = (new Error()).stack;
        }
    };
    // Extends Error
    InvalidArgumentException.prototype = Object.create(Error.prototype);
    InvalidArgumentException.prototype.name = "InvalidArgumentException";
    InvalidArgumentException.prototype.constructor = InvalidArgumentException;

    var cmds = {
        REPOS: { value: "repos", help: configs.getInstance().repos_help },
        GITHUB: { value: "github", help: configs.getInstance().github_help },
        DONATE: { value: "donate", help: configs.getInstance().donate_help },
        DATE: { value: "date", help: configs.getInstance().date_help },
        HELP: { value: "help", help: configs.getInstance().help_help },
        CLEAR: { value: "clear", help: configs.getInstance().clear_help },
        WHOAMI: { value: "whoami", help: configs.getInstance().whoami_help }
    };

    var Terminal = function (prompt, cmdLine, output, sidemenu, sidemenuul, user, host, root, outputTimer) {
        if (!(prompt instanceof Node) || prompt.nodeName.toUpperCase() !== "DIV") {
            throw new InvalidArgumentException("Invalid value " + prompt + " for argument 'prompt'.");
        }
        if (!(cmdLine instanceof Node) || cmdLine.nodeName.toUpperCase() !== "INPUT") {
            throw new InvalidArgumentException("Invalid value " + cmdLine + " for argument 'cmdLine'.");
        }
        if (!(output instanceof Node) || output.nodeName.toUpperCase() !== "DIV") {
            throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");
        }
        if (!(profilePic instanceof Node) || profilePic.nodeName.toUpperCase() !== "IMG") {
            throw new InvalidArgumentException("Invalid value " + profilePic + " for argument 'profilePic'.");
        }
        (typeof user === "string" && typeof host === "string") && (this.completePrompt = user + "@" + host + ":~" + (root ? "#" : "$"));
        this.prompt = prompt;
        this.cmdLine = cmdLine;
        this.output = output;
        this.sidemenu = sidemenu;
        this.sidemenuul = sidemenuul;
        this.sidemenuElements = [];
        this.typeSimulator = new TypeSimulator(outputTimer, output);
    };

    Terminal.prototype.type = function (text, callback) {
        this.typeSimulator.type(text, callback);
    };

    Terminal.prototype.exec = function () {
        var command = this.cmdLine.value;
        this.cmdLine.value = "";
        this.prompt.textContent = "";
        this.output.innerHTML += "<span class=\"prompt-color\">" + this.completePrompt + "</span> " + command + "<br/>";
    };

    Terminal.prototype.init = function () {
        this.cmdLine.disabled = true;
        this.prepareSideMenu();
        this.lock();
        this.cmdLine.addEventListener("keydown", function (event) {
            if (event.which === 13 || event.keyCode === 13) {
                this.handleCmd();
                ignoreEvent(event);
            } else if (event.which === 9 || event.keyCode === 9) {
                this.handleFill();
                ignoreEvent(event);
            }
        }.bind(this));
        this.reset();
    };

    Terminal.makeElementDisappear = function (element) {
        element.style.opacity = 0;
        element.style.transform = "translateX(-300px)";
    };

    Terminal.makeElementAppear = function (element) {
        element.style.opacity = 1;
        element.style.transform = "translateX(0)";
    };

    Terminal.prototype.prepareSideMenu = function () {
        var capFirst = (function () {
            return function (string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
        })();
        for (var command in commands.getInstance()) {
            var lielem = document.createElement("li");
            var icon = document.createElement("i");
            var element = document.createElement("a");

            element["href"] = "#";
            icon.classList.add("fa");
            var fonticon = "fa-cog";
            switch (command) {
                case "repos":
                    fonticon = "fa-code";
                    break;
                case "github":
                    fonticon = "fa-github";
                    break;
                case "donate":
                    fonticon = "fa-money";
                    break;
                case "date":
                    fonticon = "fa-calendar";
                    break;
                case "help":
                    fonticon = "fa-question";
                    break;
                case "clear":
                    fonticon = "fa-eraser";
                    break;
                case "whoami":
                    fonticon = "fa-user";
                    break;
            }
            icon.classList.add(fonticon);
            lielem.appendChild(element);
            element.onclick = function (command, event) {
                this.cmdLine.value = command;
                this.handleCmd();
            }.bind(this, command);
            icon.appendChild(document.createTextNode(capFirst(command)));
            element.appendChild(icon);
            element.appendChild(icon);
            this.sidemenuul.appendChild(lielem);
            this.sidemenuElements.push(lielem);
        }
    };

    Terminal.prototype.handleSidenav = function (event) {
        ignoreEvent(event);
    };

    Terminal.prototype.lock = function () {
        this.exec();
        this.cmdLine.blur();
        this.cmdLine.disabled = true;
    };

    Terminal.prototype.unlock = function () {
        this.cmdLine.disabled = false;
        this.prompt.textContent = this.completePrompt;
        scrollToBottom();
        this.focus();
    };

    Terminal.prototype.handleFill = function () {
        var cmdComponents = this.cmdLine.value.trim().split(" ");
        if ((cmdComponents.length <= 1)) {
            this.lock();
            var possibilities = [];
            for (var command in cmds) {
                if (cmds[command].value.startsWith(cmdComponents[0].toLowerCase())) {
                    possibilities.push(cmds[command].value);
                }
            }
            if (possibilities.length === 1) {
                this.cmdLine.value = possibilities[0] + " ";
                this.unlock();
            } else if (possibilities.length > 1) {
                this.type(possibilities.join("\n"), function () {
                    this.cmdLine.value = cmdComponents.join(" ");
                    this.unlock();
                }.bind(this));
            } else {
                this.cmdLine.value = cmdComponents.join(" ");
                this.unlock();
            }
        }
    };

    Terminal.prototype.handleCmd = function () {
        var cmdComponents = this.cmdLine.value.trim().split(" ");
        this.lock();
        switch (cmdComponents[0]) {
            case cmds.WHOAMI.value:
                this.whoami();
                break;
            case cmds.REPOS.value:
                this.repos();
                break;
            case cmds.DONATE.value:
                this.donate();
                break;
            case cmds.GITHUB.value:
                this.github();
                break;
            case cmds.DATE.value:
                this.date();
                break;
            case cmds.HELP.value:
                this.help();
                break;
            case cmds.CLEAR.value:
                this.clear();
                break;
            default:
                this.invalidCommand(cmdComponents);
                break;
        };
    };

    Terminal.prototype.whoami = function (cmdComponents) {
        var result = configs.getInstance().username + ": FuryBaguette\n" + configs.getInstance().hostname + ": " + configs.getInstance().host;
        this.type(result, this.unlock.bind(this));
    };

    Terminal.prototype.repos = function (cmdComponents) {
        //this.output.innerHTML += "<div id=\"repos-container\"> <div id=\"repos-wrapper\"> <div id=\"repos\"> <div class=\"hover-flip\"> <a href=\"https://github.com/FuryBaguette/SwitchLayoutEditor\" target=\"_blank\"> <div class=\"repos-item\"> <div class=\"front\"> <h3>SwitchLayoutEditor</h3> <p>This program can edit and render BFLYT files commonly used for layouts in Switch interfaces and games. It enables you to easily create/edit themes.</p></div><div class=\"back layout-editor\"></div></div></a> </div><div class=\"hover-flip\"> <a href=\"https://github.com/FuryBaguette/Brane\" target=\"_blank\"> <div class=\"repos-item\"> <div class=\"front\"> <h3>Brane</h3> <p>Game management/loader for the Nintendo Switch.</p></div><div class=\"back brane\"></div></div></a> </div><div class=\"hover-flip\"> <div class=\"repos-item\"> <div class=\"front\"> <h3>Test</h3> <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eget felis turpis. Sed ultricies euismod mi a suscipit.</p></div><div class=\"back\"> <h3>Back</h3> <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eget felis turpis. Sed ultricies euismod mi a suscipit.</p></div></div></div><div class=\"hover-flip\"> <div class=\"repos-item\"> <div class=\"front\"> <h3>Test</h3> <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eget felis turpis. Sed ultricies euismod mi a suscipit.</p></div><div class=\"back\"> <h3>Back</h3> <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eget felis turpis. Sed ultricies euismod mi a suscipit.</p></div></div></div></div></div></div>";
        var allRepos = [
          ['SwitchLayoutEditor', 'This program can edit and render BFLYT files commonly used for layouts in Switch interfaces and games. It enables you to easily create/edit themes.', 'https://github.com/FuryBaguette/SwitchLayoutEditor', "https://raw.githubusercontent.com/FuryBaguette/SwitchLayoutEditor/master/Screenshots/MainMenu.png"],
          ['Brane', 'Game management for the Nintendo Switch.', 'https://github.com/FuryBaguette/Brane', 'https://raw.githubusercontent.com/FuryBaguette/Brane/master/icon.jpg?token=ArzMle1Vi9kYuDHth0Hs1m67Z_CeMwE3ks5cntwIwA%3D%3D'],
          ['Testing', 'Some description text', 'https://somesite.com', 'https://raw.githubusercontent.com/FuryBaguette/Brane/master/icon.jpg?token=ArzMle1Vi9kYuDHth0Hs1m67Z_CeMwE3ks5cntwIwA%3D%3D'],
          ['Testing', 'Some description text', 'https://somesite.com', 'https://raw.githubusercontent.com/FuryBaguette/Brane/master/icon.jpg?token=ArzMle1Vi9kYuDHth0Hs1m67Z_CeMwE3ks5cntwIwA%3D%3D'],
        ];

        for (var i = 0; i <= allRepos.length; i++) {
            var div = document.createElement("div");
            div.classList.add("proj-item");
            var title = document.createElement("p");
            title.classList.add("title");
            title.innerHTML = allRepos[i][0];
            div.appendChild(title);

            var desc = document.createElement("p");
            desc.classList.add("description");
            desc.innerHTML = allRepos[i][1];
            div.appendChild(desc);

            var url = document.createElement("a");
            url.classList.add("url");
            url["href"] = allRepos[i][2];
            url["target"] = "_blank";
            url["alt"] = allRepos[i][0];

            var thumb = document.createElement("img");
            thumb.classList.add("thumbnail");
            thumb["src"] = allRepos[i][3];
            div.appendChild(thumb);

            url.appendChild(div);

            this.output.appendChild(url);

            /*this.output.innerHTML += "<br/>";
            this.output.innerHTML += allRepos[i][1];
            this.output.innerHTML += "<br/>";
            this.output.innerHTML += allRepos[i][2];
            this.output.innerHTML += "<br/>";*/
        }
        this.type("Click on a card to get to the project page", this.unlock.bind(this));
    };

    Terminal.prototype.donate = function (cmdComponents) {
        this.type("Thank you for taking the time!", this.unlock.bind(this));
        var win = window.open(configs.getInstance().donate_url);
        win.focus();
    };

    Terminal.prototype.github = function (cmdComponents) {
        this.type("Mmmh i don't know what to write here", this.unlock.bind(this));
        var win = window.open(configs.getInstance().github_url);
        win.focus();
    };

    Terminal.prototype.date = function (cmdComponents) {
        this.type(new Date().toString(), this.unlock.bind(this));
    };

    Terminal.prototype.help = function () {
        var result = configs.getInstance().general_help + "\n\n";
        for (var cmd in cmds) {
            result += cmds[cmd].value + " - " + cmds[cmd].help + "\n";
        }
        this.type(result.trim(), this.unlock.bind(this));
    };

    Terminal.prototype.clear = function () {
        this.output.textContent = "";
        this.prompt.textContent = "";
        this.prompt.textContent = this.completePrompt;
        this.unlock();
    };

    Terminal.prototype.reset = function () {
        this.output.textContent = "";
        this.prompt.textContent = "";
        if (this.typeSimulator) {
            this.type(configs.getInstance().welcome + (isUsingIE ? "\n" + configs.getInstance().internet_explorer_warning : ""), function () {
                this.unlock();
                this.output.innerHTML += "<br/>";
                this.help();
            }.bind(this));
        }
    };

    Terminal.prototype.permissionDenied = function (cmdComponents) {
        this.type(configs.getInstance().permission_denied_message.replace(configs.getInstance().value_token, cmdComponents[0]), this.unlock.bind(this));
    };

    Terminal.prototype.invalidCommand = function (cmdComponents) {
        this.type(configs.getInstance().invalid_command_message.replace(configs.getInstance().value_token, cmdComponents[0]), this.unlock.bind(this));
    };

    Terminal.prototype.focus = function () {
        this.cmdLine.focus();
    };

    var TypeSimulator = function (timer, output) {
        var timer = parseInt(timer);
        if (timer === Number.NaN || timer < 0) {
            throw new InvalidArgumentException("Invalid value " + timer + " for argument 'timer'.");
        }
        if (!(output instanceof Node)) {
            throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");
        }
        this.timer = timer;
        this.output = output;
    };

    TypeSimulator.prototype.type = function (text, callback) {
        if (isURL(text)) {
            window.open(text);
        }
        var i = 0;
        var output = this.output;
        var timer = this.timer;
        var skipped = true;
        var skip = function () {
            skipped = true;
        }.bind(this);
        document.addEventListener("dblclick", skip);
        (function typer() {
            if (i < text.length) {
                var char = text.charAt(i);
                var isNewLine = char === "\n";
                output.innerHTML += isNewLine ? "<br/>" : char;
                i++;
                if (!skipped) {
                    setTimeout(typer, isNewLine ? timer * 2 : timer);
                } else {
                    output.innerHTML += (text.substring(i).replace(new RegExp("\n", 'g'), "<br/>")) + "<br/>";
                    document.removeEventListener("dblclick", skip);
                    callback();
                }
            } else if (callback) {
                output.innerHTML += "<br/>";
                document.removeEventListener("dblclick", skip);
                callback();
            }
            scrollToBottom();
        })();
    };

    return {
        listener: function () {
            new Terminal(
                document.getElementById("prompt"),
                document.getElementById("cmdline"),
                document.getElementById("output"),
                document.getElementById("sidemenu"),
                document.getElementById("sidemenuul"),
                configs.getInstance().user,
                configs.getInstance().host,
                configs.getInstance().is_root,
                configs.getInstance().type_delay
            ).init();
        }
    };
})();

window.onload = main.listener;
