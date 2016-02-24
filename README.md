# Bioinput

Bioinput is a JavaScript library built around the [jQuery](https://jquery.com/),
[typeahead.js](https://twitter.github.io/typeahead.js), and
[Bootstrap Tags Input](http://bootstrap-tagsinput.github.io/bootstrap-tagsinput/examples/) libraries.
It allows you to quickly and easily implement an autocomplete html input element for various
biological entities. It was created in hopes that it would assist in the standardizing of biological terms.
###Getting Started
Include Bioinput (and its dependencies) by adding them to an HTML page in your project.
This is done by first including the a copy of the Bioinput css in
your `<head></head>` tags:
```html
<head>
  ...
  <link rel="stylesheet" href="https://cdn.rawgit.com/MaayanLab/bioinput/v0.3.0/dist/bioinput.min.css">
  ...
</head>
```
Secondly, include the JavaScript. Be careful with the order of the projects you're including.
jQuery should be first and then Bioinput. These can also go in
your `<head></head>` tags, however its often best to include them
at the bottom of your html body. (Right before `</body>`)
```html
  ...
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
  <script src="https://cdn.rawgit.com/MaayanLab/bioinput/v0.3.0/dist/bioinput.js"></script>
</body>
```

###Usage and Example
The easiest way to use Bioinput is to add two attributes to any html input.

Adding data-role="bioinput" turns a normal input into a Bioinput and adding
data-entity-type="assay" would enable assay autocomplete.
(Currently **assay**, **cell**, **gene**, **disease**, and **organism** are supported.)
```html
<form>
  <div class="form-group assay">
    <label for="assay">Assay Input</label>
    <input id="assay" class="form-control" type="text"
      data-role="bioinput" data-entity-type="assay" />
  </div>
  <div class="form-group cell">
    <label for="cell">Cell Input</label>
    <input id="cell" class="form-control" type="text"
      data-role="bioinput" data-entity-type="cell" />
  </div>
</form>
```
###Getting Results
Continuing with the example, the entities the user has selected can be accessed as follows:
```javascript
$('#assay').bioinput('entities');
$('#cell').bioinput('entities');:
```
