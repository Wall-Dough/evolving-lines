var canvas;
var ctx;
var tree_canvas;
var tree_ctx;
var clicked = false;
var current_lineage = 0;
var root = null;
var root_fork = null;
var current_node = null;
var animation_node = null;
var current_i = 0;
var current_j = 0;
var animationID = null;
var animating = false;
var mode = 0;
var current_id = 0;
var direction = 0;
var drawing = true;
var grid = [];
var nodes = 100;
var tree_mouse_p = null;
var tree_mouse_d = null;

function swap_mode() {
	mode = 1 - mode;
	if (mode == 0) {
		document.getElementById("mode").setAttribute("value", "Mode: Drawing");
	}
	else {
		document.getElementById("mode").setAttribute("value", "Mode: Viewing");
	}
	draw_line(current_node);
}

function clear_tree() {
	for (var i = 0; i < grid.length; i++) {
		for (var j = 0; j < grid[i].length; j++) {
			grid[i][j] = 0;
		}
	}
}

function snap(coord) {
	return Math.floor(coord / 3) * 3;
}

function draw_node(node, x, y) {
	grid[x + 3][y + 3] = 1;
}

function traverse_too(left_x, right_x, y, z, depth) {
	var x1 = (left_x + right_x) / 2;
	if (depth <= 0) {
		tree_ctx.beginPath();
		tree_ctx.arc(snap(x1), snap(y), 3, 0, 2 * Math.PI, false);
		tree_ctx.fillStyle = 'gray';
		tree_ctx.fill();
		tree_ctx.lineWidth = 1;
		tree_ctx.strokeStyle = 'black';
		tree_ctx.stroke();
		return;
	}
	var x2 = (left_x + x1) / 2;
	var x3 = (x1 + right_x) / 2;
	var y2 = y + z;
	tree_ctx.beginPath();
	tree_ctx.moveTo(snap(x1), snap(y));
	tree_ctx.lineTo(snap(x2), snap(y2));
	tree_ctx.stroke();
	tree_ctx.beginPath();
	tree_ctx.moveTo(snap(x1), snap(y));
	tree_ctx.lineTo(snap(x3), snap(y2));
	tree_ctx.stroke();
	tree_ctx.beginPath();
    tree_ctx.arc(snap(x1), snap(y), 3, 0, 2 * Math.PI, false);
	tree_ctx.fillStyle = 'gray';
    tree_ctx.fill();
    tree_ctx.lineWidth = 1;
    tree_ctx.strokeStyle = 'black';
    tree_ctx.stroke();
	if (Math.random() > 0.25) {
		traverse_too(left_x, x1, y2, z, depth - 1);
	}
	else {
		tree_ctx.beginPath();
		tree_ctx.arc(snap(x2), snap(y2), 3, 0, 2 * Math.PI, false);
		tree_ctx.fillStyle = 'gray';
		tree_ctx.fill();
		tree_ctx.lineWidth = 1;
		tree_ctx.strokeStyle = 'black';
		tree_ctx.stroke();
	}
	if (Math.random() > 0.25) {
		traverse_too(x1, right_x, y2, z, depth - 1);
	}
	else {
		tree_ctx.beginPath();
		tree_ctx.arc(snap(x3), snap(y2), 3, 0, 2 * Math.PI, false);
		tree_ctx.fillStyle = 'gray';
		tree_ctx.fill();
		tree_ctx.lineWidth = 1;
		tree_ctx.strokeStyle = 'black';
		tree_ctx.stroke();
	}
}

function tree_mouseover(e) {
	if (tree_mouse_p != null) {
		tree_ctx.putImageData(tree_mouse_d, tree_mouse_p.x, tree_mouse_p.y);
	}
	var p = get_current_tree_p(e);
	tree_ctx.beginPath();
	tree_ctx.arc(snap(p.x), snap(p.y), 3, 0, 2 * Math.PI, false);
	tree_ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
	tree_ctx.fill();
	tree_ctx.lineWidth = 1;
	tree_ctx.strokeStyle = 'black';
	tree_ctx.stroke();
}

function traverse(x, y, z, depth) {
	if (depth <= 0) {
		return;
	}
	var next_y = y + 20;
	var left_x = x - (z);
	var right_x = x + (z);
	if ((next_y > tree_canvas.height) || (left_x < 0) || (right_x > tree_canvas.width)) {
		return;
	}
	tree_ctx.beginPath();
	tree_ctx.moveTo(x, y);
	tree_ctx.lineTo(left_x, next_y);
	tree_ctx.stroke();
	tree_ctx.beginPath();
	tree_ctx.moveTo(x, y);
	tree_ctx.lineTo(right_x, next_y);
	tree_ctx.stroke();
	traverse(left_x, next_y, z / 2, depth - 1);
	traverse(right_x, next_y, z / 2, depth - 1);
}

function draw_tree() {
	tree_ctx.beginPath();
    tree_ctx.rect(0, 0, tree_canvas.width, tree_canvas.height);
    tree_ctx.fillStyle = "rgba(255, 255, 255, 1)";
    tree_ctx.fill();
	var left_x = 0;
	var right_x = tree_canvas.width;
	var y = tree_canvas.height / 2;
	var depth = 7;
	var z = ((tree_canvas.width / depth) - 2) / 3;
	var x1 = (left_x + right_x) / 2;
	var y1 = y - z;
	var y2 = y + z;
	tree_ctx.beginPath();
	tree_ctx.moveTo(x1, y);
	tree_ctx.lineTo(x1, y1);
	tree_ctx.stroke();
	tree_ctx.beginPath();
	tree_ctx.moveTo(x1, y);
	tree_ctx.lineTo(x1, y2);
	tree_ctx.stroke();
	tree_ctx.beginPath();
    tree_ctx.arc(x1, y, 3, 0, 2 * Math.PI, false);
	tree_ctx.fillStyle = 'gray';
    tree_ctx.fill();
    tree_ctx.lineWidth = 1;
    tree_ctx.strokeStyle = 'black';
    tree_ctx.stroke();
	traverse_too(left_x, right_x, y + z, z, depth - 1);
	traverse_too(left_x, right_x, y - z, -z, depth - 1);
}

function get_new_node() {
	return {
		id: current_id++,
		parent: null,
		large: null,
		small: null,
		left: null,
		right: null,
		direction: 0
	};
}

function get_new_p() {
	return {
		x: -1,
		y: -1
	};
}

function get_current_p(e) {
	var canvas = document.getElementById("canvas");
	var p = get_new_p();
	var rect = canvas.getBoundingClientRect();
	p.x = Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
	p.y = Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
	return p;
}

var mouse_p = get_new_p();

var prev_p = get_new_p();

function mouse_move(e) {
	if ((mode == 1) || (!drawing) || (!clicked)) {
		return;
	}
	document.getElementById("done").removeAttribute("disabled");
	prev_p = mouse_p;
	mouse_p = get_current_p(e);
	ctx.beginPath();
	ctx.moveTo(prev_p.x, prev_p.y);
	ctx.lineTo(mouse_p.x, mouse_p.y);
	ctx.stroke();
}

function mouse_down(e) {
	if ((mode == 1) || (!drawing) || (clicked)) {
		return;
	}
	clicked = true;
	mouse_p = get_current_p(e);
	prev_p = mouse_p;
}

function hide_lines() {
	var div = document.getElementById("lines");
	div.innerHTML = "";
}

function add_image(node) {
	var div = document.getElementById("lines");
	div.appendChild(node.small);
	if (node.left != null) {
		add_image(node.left);
	}
	if (node.right != null) {
		add_image(node.right);
	}
}

function show_lines() {
	hide_lines();
	add_image(root);
}

function draw_line(node) {
	if (node == null) {
		return;
	}
	clear_canvas();
	ctx.drawImage(node.large, 0, 0);
	if ((mode == 0) && (!animating)) {
		fade_canvas();
	}
}

function draw_frame() {
	draw_line(animation_node);
	if (animation_node.left != null) {
		animation_node = animation_node.left;
	}
	else if (animation_node.right != null) {
		animation_node = animation_node.right;
	}
	else {
		animation_node = root;
	}
}

function stop_animation() {
	if (animating) {
		document.getElementById("start").removeAttribute("disabled");
		document.getElementById("done").removeAttribute("disabled");
		document.getElementById("stop").setAttribute("disabled", "true");
		document.getElementById("parent").removeAttribute("disabled");
		document.getElementById("left").removeAttribute("disabled");
		document.getElementById("right").removeAttribute("disabled");
		clearInterval(animationID);
		animating = false;
		animation_node = null;
		draw_line(current_node);
	}
}

function start_animation() {
	if (!animating) {
		document.getElementById("start").setAttribute("disabled", "true");
		document.getElementById("done").setAttribute("disabled", "true");
		document.getElementById("stop").removeAttribute("disabled");
		document.getElementById("parent").setAttribute("disabled", "true");
		document.getElementById("left").setAttribute("disabled", "true");
		document.getElementById("right").setAttribute("disabled", "true");
		animating = true;
		animation_node = root;
		animationID = setInterval(draw_frame, 100);
	}
}

function clear_canvas() {
	ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fill();
}

function fade_canvas() {
	ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fill();
}

function fix_node_buttons() {
	if (current_node.parent != null) {
		document.getElementById("parent").removeAttribute("disabled");
	}
	else {
		document.getElementById("parent").setAttribute("disabled", "true");
	}
	if (current_node.left != null) {
		document.getElementById("left").removeAttribute("disabled");
	}
	else {
		document.getElementById("left").setAttribute("disabled", "true");
	}
	if (current_node.right != null) {
		document.getElementById("right").removeAttribute("disabled");
	}
	else {
		document.getElementById("right").setAttribute("disabled", "true");
	}
	if ((current_node.left != null) && (current_node.right != null)) {
		drawing = false;
	}
	else {
		drawing = true;
	}
}
	

function parent_node() {
	if (current_node.parent != null) {
		current_node = current_node.parent;
	}
	fix_node_buttons();
	draw_line(current_node);
}

function left_node() {
	if (current_node.left != null) {
		current_node = current_node.left;
		direction = 0;
		fix_node_buttons();
		draw_line(current_node);
	}
}

function right_node() {
	if (current_node.right != null) {
		current_node = current_node.right;
		direction = 1;
		fix_node_buttons();
		draw_line(current_node);
	}
}

function save_line() {
	document.getElementById("done").setAttribute("disabled", "true");
	var img = document.createElement("img");
	img.src = canvas.toDataURL();
    var small_img = document.createElement("img");
    small_img.src = img.src;
    small_img.setAttribute("width", "200");
    small_img.setAttribute("height", "200");
    if (root == null) {
    	root = get_new_node();
    	current_node = root;
    }
    else {
    	if (direction == 0) {
			if (current_node.left == null) {
				current_node.left = get_new_node();
				current_node.left.parent = current_node;
				current_node = current_node.left;
			}
			else if (current_node.right == null) {
				direction = 1;
				current_node.right = get_new_node();
				current_node.right.parent = current_node;
				current_node = current_node.right;
			}
		}
		else {
			if (current_node.right == null) {
				current_node.right = get_new_node();
				current_node.right.parent = current_node;
				current_node = current_node.right;
			}
			else if (current_node.left == null) {
				direction = 0;
				current_node.left = get_new_node();
				current_node.left.parent = current_node;
				current_node = current_node.left;
			}
		}
    }
	current_node.direction = direction;
    current_node.large = img;
    current_node.small = small_img;
    fade_canvas();
    fix_node_buttons();
}

function mouse_up(e) {
	if (clicked) {
		clicked = false;
		prev_p = get_new_p();
		current_p = get_new_p();
	}
}

window.onload = function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	tree_canvas = document.getElementById("tree");
	tree_ctx = tree_canvas.getContext("2d");
	canvas.addEventListener('mousemove', mouse_move, false);
	canvas.addEventListener('mouseup', mouse_up, false);
	canvas.addEventListener('mousedown', mouse_down, false);
	tree_canvas.addEventListener('mousemove', check_tree, false);
}