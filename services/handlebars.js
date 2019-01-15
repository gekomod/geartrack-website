var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
var register = function(Handlebars) {
    var helpers = {
    append: function(name, options) {
        if(!this._sections)
      this._sections = {}

    if(this._sections[name])
      this._sections[name] += options.fn(this) // append if there is already content
    else
      this._sections[name] = options.fn(this) // save the content of the block

    return null
    },
    section: function(name) {
          if(this._sections && this._sections[name])
      return new handlebars.handlebars.SafeString(this._sections[name])

    return null
    },
    year: function() {
       return new Date().getFullYear()
    },
    compare: function (lvalue, operator, rvalue, options) {
        var operators, result;

        if (arguments.length < 3) {
            throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
        }

        if (options === undefined) {
            options = rvalue;
            rvalue = operator;
            operator = "===";
        }

        operators = {
            '==': function (l, r) { return l == r; },
            '===': function (l, r) { return l === r; },
            '!=': function (l, r) { return l != r; },
            '!==': function (l, r) { return l !== r; },
            '<': function (l, r) { return l < r; },
            '>': function (l, r) { return l > r; },
            '<=': function (l, r) { return l <= r; },
            '>=': function (l, r) { return l >= r; },
            'typeof': function (l, r) { return typeof l == r; }
        };

        if (!operators[operator]) {
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
        }

        result = operators[operator](lvalue, rvalue);

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    }
};

if (Handlebars && typeof Handlebars.registerHelper === "function") {
    for (var prop in helpers) {
        Handlebars.registerHelper(prop, helpers[prop]);
    }
} else {
    return helpers;
}

};

module.exports.register = register;
module.exports.helpers = register(null); 