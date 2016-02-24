# Bioinput

Bioinput is a JavaScript library built around the [jQuery](https://jquery.com/),
[typeahead.js](https://twitter.github.io/typeahead.js), and
[Bootstrap Tags Input](http://bootstrap-tagsinput.github.io/bootstrap-tagsinput/examples/) libraries.
It allows you to quickly and easily implement an autocomplete html input element for various
biological entities. It was created in hopes that it would assist in the standardizing of biological terms.
###Getting Started
Include Bioinput by adding the script tag to your project's HTML file. Bioinput requires that jQuery is available, so be sure to include it after jQuery, as shown below:
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
