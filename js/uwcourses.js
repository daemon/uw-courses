var courseGraph = {};
var courses = [];
var width = window.innerWidth;
var height = window.innerHeight;
var activeCourse = null;
var colorPalette = [0xff5555, 0x55ff55, 0x5555ff, 0x55ffff, 0xff55ff];
var searchBarActive = false;

function BoundingBox(x, y, width, height) {
  this.x1 = x;
  this.y1 = y;
  this.x2 = x + width;
  this.y2 = y + height;
  this.width = width;
  this.height = height;
}

BoundingBox.LEFT = 0;
BoundingBox.TOP = 1;
BoundingBox.RIGHT = 2;
BoundingBox.BOTTOM = 3;

BoundingBox.prototype.intersects = function(other) {
  var xIntersects = (this.x1 < other.x2 && this.x1 > other.x1) || (this.x2 < other.x2 && this.x2 > other.x1);
  var yIntersects = (this.y1 < other.y2 && this.y1 > other.y1) || (this.y2 < other.y2 && this.y2 > other.y1);
  if (xIntersects && yIntersects) {
    var minSide = BoundingBox.LEFT;
    var minDist = Math.abs(this.x1 - other.x2);
    var dist = Math.abs(this.x2 - other.x1);
    if (dist < minDist) {
      minDist = dist;
      minSide = BoundingBox.RIGHT;
    }
    dist = Math.abs(this.y1 - other.y2);
    if (dist < minDist) {
      minDist = dist;
      minSide = BoundingBox.TOP;
    }
    dist = Math.abs(this.y2 - other.y1);
    if (dist < minDist) {
      minDist = dist;
      minSide = BoundingBox.BOTTOM;
    }
    return minSide;
  } else {
    return null;
  }
}

function Course(name, title, description, prereqs, stage) {
  this.name = name;
  this.title = title;
  this.titleText = null;
  this.descText = null;
  this.description = description;
  this.prereqs = prereqs;
  this.stage = stage;
  this.prereqLineGraphics = new PIXI.Graphics();
  this.text = new PIXI.Text(name, {font: '16px Arial', fill: 0x111111, align: 'center'});  
  this.text.position.x = Math.random() * width;
  this.text.position.y = Math.random() * height;
  if (this.text.position.x + this.text.width > width)
    this.text.position.x -= this.text.width;
  if (this.text.position.y + this.text.height > height)
    this.text.position.y -= this.text.height;
  this.text.interactive = true;
  var selectCourse = this;
  this.text.on('mousedown', function() {
    if (activeCourse) {
      activeCourse.eraseDetails();
      activeCourse.unhighlightPrereqs();
      activeCourse.text.style.font = '16px Arial';
    }
    activeCourse = selectCourse;
    activeCourse.text.style.font = 'bold 20px Arial';
    activeCourse.text.alpha = 1;
    activeCourse.drawDetails();
    for (var courseNo in courses) {
      var course = courses[courseNo];
      if (course.name === name)
        continue;
      course.text.alpha = 0.3;
    }
  });
  this.dX = Math.random() - 0.5;
  this.dY = Math.random() - 0.5;
  this.bbox = new BoundingBox(this.text.position.x, this.text.position.y, this.text.width, this.text.height);
}

function lighten(color) {
  var r = (color & 0xff0000) >> 16;
  var g = (color & 0x00ff00) >> 8;
  var b = (color & 0x0000ff);
  r = Math.min(r + 30, 0xff);
  g = Math.min(g + 30, 0xff);
  b = Math.min(b + 30, 0xff);
  return (r << 16) | (g << 8) | b;
}

Course.prototype.unhighlightPrereqs = function() {
  this.stage.removeChild(this.prereqLineGraphics);
  for (var i in this.prereqs) {
    var prereqSet = this.prereqs[i];
    for (var j in prereqSet) {
      var prereq = prereqSet[j];
      var course = courseGraph[prereq.split("!")[0]];
      if (!course)
        continue;
      course.courseObj.unhighlightPrereqs();
    }
  }
}

Course.prototype.highlightPrereqs = function(level) {
  this.stage.removeChild(this.prereqLineGraphics);
  this.prereqLineGraphics = new PIXI.Graphics();
  var colorIndex = 0;
  for (var i in this.prereqs) {
    var prereqSet = this.prereqs[i];
    var color = colorPalette[colorIndex];
    var found = false;
    for (var k = 0; k < level; ++k)
      color = lighten(color);
    this.prereqLineGraphics.lineStyle(1, color);
    for (var j in prereqSet) {
      var prereq = prereqSet[j];
      var course = courseGraph[prereq.split("!")[0]];
      if (!course)
        continue;
      found = true;
      //course.courseObj.highlightPrereqs(level + 1);
      course.courseObj.text.alpha = 1;
      this.prereqLineGraphics.moveTo(this.text.position.x, this.text.position.y);
      this.prereqLineGraphics.lineTo(course.courseObj.text.position.x, course.courseObj.text.position.y);
    }
    if (found)
      ++colorIndex;
  }
  this.stage.addChildAt(this.prereqLineGraphics, 0);  
}

Course.prototype.tick = function() {
  this.bbox = new BoundingBox(this.text.position.x, this.text.position.y, this.text.width, this.text.height);
  if (this === activeCourse) {
    this.highlightPrereqs(0);   
    return;
  } else if (activeCourse) {}
  if (this.text.position.x + this.text.width > width || this.text.position.x < 0)
    this.dX = -this.dX;
  if (this.text.position.y + this.text.height > height || this.text.position.y < 0)
    this.dY = -this.dY;
  this.text.position.x += this.dX;
  this.text.position.y += this.dY;
}

Course.prototype.drawDetails = function() {  
  this.titleText = new PIXI.Text(this.title, {font: '20px Arial', fill: 0x111111});
  this.titleText.position.x = Math.min(this.text.position.x, width - this.titleText.width - 10);
  this.titleText.position.y = this.text.position.y + 28;
  this.stage.addChild(this.titleText);
  this.descText = new PIXI.Text(this.description, {font: '16px Arial', fill: 0x111111, wordWrap: true, wordWrapWidth: 400});
  this.descText.position.x = Math.min(Math.min(this.titleText.position.x, width - this.descText.width - 10), this.titleText.position.x);
  this.titleText.position.x = Math.min(this.titleText.position.x, this.descText.position.x);
  this.descText.position.y = this.titleText.position.y + 28;
  if (this.descText.position.y + this.descText.height > height) {
    this.descText.position.y = this.text.position.y - this.descText.height - this.titleText.height - 16;
    this.titleText.position.y = this.text.position.y - this.titleText.height - 8;    
  }
  this.stage.addChild(this.descText);
}

Course.prototype.eraseDetails = function() {
  if (this.titleText) {
    this.stage.removeChild(this.titleText)
    this.stage.removeChild(this.descText);
    this.titleText = null;
    this.descText = null;
  }
}

function keydownHandler(event) {
  if (event.key === 'f' && event.ctrlKey) {
    $("#searchbar").show();
    $("#searchbar").focus();
    $("#searchbar").select();
    event.preventDefault();
    searchBarActive = true;
  } else if (searchBarActive && event.code === "Enter") {
    $("#searchbar").hide();
    searchBarActive = false;
  } else if (event.code === "Escape" && $("#searchbar").val() != "") {
    $("#searchbar").hide();
    searchBarActive = false;
    $("#searchbar").val("");
    highlightFoundCourses();
  }
}

function highlightFoundCourses() {
  var name = $("#searchbar").val();
  for (var i in courses) {
    var course = courses[i];
    if (!course.name.startsWith(name.toUpperCase()))
      course.text.alpha = 0.3;
    else
      course.text.alpha = 1;
  }
}

function main() {
  $(document).ready(function() {
    $("#searchbar").bind('input', function() { 
      highlightFoundCourses();
    });
    $("#searchbar").hide();
  });
  var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {backgroundColor: 0xfefefe});
  document.body.appendChild(renderer.view);
  var stage = new PIXI.Container();
  var dummy = new PIXI.Graphics();
  dummy.drawRect(0, 0, width, height);
  dummy.beginFill(0);
  dummy.alpha = 0;
  dummy.hitArea = dummy.getBounds();
  dummy.interactive = true;
  dummy.on('mousedown', function() {
    if (!activeCourse)
      return;
    activeCourse.text.style.font = '16px Arial';
    activeCourse.eraseDetails();
    activeCourse.unhighlightPrereqs();
    for (courseNo in courses) {
      var course = courses[courseNo];
      highlightFoundCourses();
    }
    activeCourse = null;  
  });
  window.addEventListener('keydown', keydownHandler); 
  stage.addChild(dummy);
  $.getJSON('/graph.json', function(data) {
    courseGraph = data;
    for (var course in courseGraph) {
      if (courseGraph.hasOwnProperty(course)) {
        var info = courseGraph[course];
        var prereqs = [];
        if (info.hasOwnProperty('prereqs'))
          prereqs = info['prereqs'];
        var courseObj = new Course(course, info.title, info.description, prereqs, stage);
        courses.push(courseObj);
        info.courseObj = courseObj;
        stage.addChild(courseObj.text);
      }
    }

    animate();  
    function animate() {
      for (var courseNo in courses) {
        courses[courseNo].tick();            
      } 
      requestAnimationFrame(animate);
      renderer.render(stage);
    }
  });
}

main();
