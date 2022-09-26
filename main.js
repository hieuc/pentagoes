var topPadding = 100;
var sidePadding = 100;
var circlePadding = 4;
var circleRadius = 25;
var boardSize = 400;
var turn = "black";
var board = new Array(36).fill("empty");
var gameEnd = false;
var moves = [];
var AIDepth = 2;
var bot = new AI(AIDepth);
var mode = 2; // 1 for minimax, 2 for alpha beta
var manual = false;

function startPage() {
    makeQuadrants();
    $(".rotate-options").css("display", "none");
    $("body").html($("body").html());
}

