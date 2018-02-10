//définition du controleur
var ctrl = function(){
    this.model = new model();
    this.vue = new vue(this, this.model);
}

ctrl.prototype.show = function(){
    this.vue.show();
}
