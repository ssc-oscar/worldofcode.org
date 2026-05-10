# Old material

This file contains material that used to be Part F of `tutorial.md`.

## Part F -- Remaining content

### Detecting percentage language use and changes over time (Complex)

An application to calculate this would be useful for seeing how different authors changed languages over a range of years, based on the commits they have made to different files.

In order to accomplish this task, we will modify an existing program from the `swsc/lookup` repo ([a2fBinSorted.perl](https://bitbucket.org/swsc/lookup/src/master/a2fBinSorted.perl)) and create a new program ([a2L.py](https://bitbucket.org/swsc/lookup/src/master/a2L.py)) that will get language counts per year per author.

#### Part 1 -- Modifying a2fBinSorted.perl

For the first part, we look at what `a2fBinSorted.perl` currently does: it takes one of the 32 `a2cFullP{0-31}.s` files through STDIN, opens the 32 `c2fFullO.{0-31}.tch` files for reading, and writes a corresponding local `a2fFullP.{0-31}.tch` file based on the a2c file number.
The lines of the file are `author_id;file1;file2;file3...`

Example usage: `UNIX> zcat /da0_data/basemaps/gz/a2cFullP0.s | ./a2fBinSorted.perl 0`

We can modify this program so that it will write the earliest commit dates made by that author for those files, which will become useful for `a2L.py` later on. To accomplish this, we will have the program additionally read from the `c2taFullP.{0-31}.tch` files so we can get the time of each commit made by a given author:

```
my %c2ta;
for my $s (0..($sections-1)){
	tie %{$c2ta{$s}}, "TokyoCabinet::HDB", "/fast/c2taFullP.$s.tch", TokyoCabinet::HDB::OREADER |
	TokyoCabinet::HDB::ONOLCK,
	   16777213, -1, -1, TokyoCabinet::TDB::TLARGE, 100000
	or die "cant open fast/c2taFullP.$s.tch\n";
}
```

We will also ensure the files to be written will have the relationship `a2ft` as opposed to `a2f`:

```
my %a2ft;
tie %a2ft, "TokyoCabinet::HDB", "/data/play/dkennard/a2ftFullP.$part.tch", TokyoCabinet::HDB::OWRITER |
     TokyoCabinet::HDB::OCREAT,
	16777213, -1, -1, TokyoCabinet::TDB::TLARGE, 100000
	or die "cant open /data/play/dkennard/a2ftFullP.$part.tch\n";
```

Another important part of the file we want to change is inside the `output` function:

```
sub output {
	my $a = $_[0];
	my %fs;
	for my $c (@cs){
		my $sec =  segB ($c, $sections);
		if (defined $c2f{$sec}{$c} and defined $c2ta{$sec}{$c}){
			my @fs = split(/\;/, safeDecomp ($c2f{$sec}{$c}, $a), -1);
			my ($time, $au) = split(/\;/, $c2ta{$sec}{$c}, -1);  # add this for grabbing the time
			for my $f (@fs){
				if (defined $time and (!defined $fs{$f} or $time < $fs{$f})){  # modify condition to grab earliest time
					$fs{$f} = $time;
				}
			}
		}
	}
	$a2ft{$a} = safeComp (join ';', %fs);  # changed
}
```

Now when we run the new program, it should write individual `a2ftFullP.{0-31}.tch` files with the format:

`author_id;file1;file1_timestamp;file2;file2_timestamp;...`

We can then create a new `PATHS` dictionary entry in `oscar.py`, as well as another function under the `Author` class to read our newly-created `.tch` files:

```
In PATHS dictionary:
...
'author_file_times': ('/data/play/dkennard/a2ftFullP.{key}.tch', 5)
...

In class Author(_Base):
...
@cached_property
def file_times(self):
	data = decomp(self.read_tch('author_file_times'))
	return tuple(file for file in (data and data.split(";")))
...
```

#### Part 2 -- Creating a2L.py

Our next task involves creating `a2LFullP{0-31}.s` files utilizing the new `.tch` files we have just created. We want these files to have each line filled with the author name, each year, and the language counts for each year. A possible format could look something like this:

`"tim.bentley@gmail.com" <>;year2015;2;py;31;js;30;year2016;1;py;29;year2017;8;c;2;doc;1;py;386;html;6;sh;1;js;3;other;3;build;1`

where the number after each year represents the number of languages used for that year, followed by pairs of languages and the number of files written in that language for that year. As an example, in the year 2015, Tim Bentley made initial commits to files in 2 languages, 31 of which were in Python, and 30 of which were in JavaScript.

There are a number of things that have to happen to get to this point, so let's break it down:

* Iterating `Author().file_times` and grouping timestamps into year

We will start by reading in an `a2cFullP{0-31}.s` file to get a list of authors, which we then hold as a tuple in memory and start building our dictionary:

```
a2L[author] = {}
file_times = Author(author).file_times
for j in range(0,len(file_times),2):
	try:
		year = str(datetime.fromtimestamp(float(file_times[j+1]))).split(" ")[0].split("-")[0]
	# have to skip years either in the 20th century or somewhere far in the future
	except ValueError:
		continue
	# in case the last file listed doesn't have a time
	except IndexError:
		break
	year = specifier + year  # specifier is the string 'year'
	if year not in a2L[author]:
		a2L[author][year] = []
	a2L[author][year].append(file_times[j])
```

The `datetime.fromtimestamp()` function will turn this into a datetime format `year-month-day hour-min-sec`, which we split by a space to get the first half `year-month-day` of the string, and then split again to get `year`.

* Detecting the language of a file based on file extension

```
for year, files in a2L[author].items():
	build_list = []
	for file in files:
		la = "other"
		if re.search("\.(js|iced|liticed|iced.md|coffee|litcoffee|coffee.md|ts|cs|ls|es6|es|jsx|sjs|co|eg|json|json.ls|json5)$",file):
			la = "js"
		elif re.search("\.(py|py3|pyx|pyo|pyw|pyc|whl|ipynb)$",file):
			la = "py"
		elif re.search("(\.[Cch]|\.cpp|\.hh|\.cc|\.hpp|\.cxx)$",file):
			la = "c"
	.......
```

The simplest way to check for a language based on a file extension is to use the `re` module for regular expressions. If a given file matches a certain expression, like `.py`, then that file was written in Python. `la = "other"` if no matches were found in any of those searches.
We then keep track of these languages and put each language in a list `build_list.append(la)`, and count how many of those languages occurred when we looped through the files `build_list.count(lang)`. The final format for an author in the `a2L` dictionary will be `a2L[author][year][lang] = lang_count`.

* Writing each author's information into the file

See [a2L.py](https://bitbucket.org/swsc/lookup/src/master/a2L.py) for how information is written into each file.

Usage: `UNIX> python a2L.py 2` for writing `a2LFullP2.s`

#### Implementing the application

Now that we have our `a2L` files, we can run some interesting statistics as to how significant language usage changes over time are for different authors. The program [langtrend.py](https://bitbucket.org/swsc/lookup/src/master/langtrend.py) runs the chi-squared contingency test via `stats.chi2_contingency()` from the `scipy` module for authors from an `a2LFullP{0-31}.s` file and calculates a p-value for each pair of years for each language for each author.

This p-value means the percentage chance that you would find another person with this same extreme of change in language use, whether that be an increase or a decrease. For example, if a given author edited 300 different Python files in 2006, but then edited 500 different Java files in 2007, the percentage chance that you would see this extreme of a change in another author is very low. In fact, if this p-value is less than `0.001`, then the change in language use between a pair of years is considered significant.

In order for this p-value to be a more accurate approximation, we need a larger sample size of language counts. When reading the `a2LFullP{0-31}.s` files, you may want to rule out people who do not meet certain criteria:

* the author has at least 5 consecutive years of commits for files
* the author has edited at least 100 different files for all of their years of commits

If an author does not meet this criteria, we would not want to consider them for the chi-squared test simply because their results would be uninteresting and not worth investigating any further.

Here is one of the authors from the program's output:

----------------------------------

```
Ben Niemann <pink@odahoda.de>
{ '2015': {'doc': 3, 'markup': 2, 'obj': 1, 'other': 67, 'py': 127, 'sh': 1},
	'2016': {'doc': 1, 'other': 23, 'py': 163},
	'2017': {'build': 36, 'c': 116, 'lsp': 1, 'other': 81, 'py': 160},
	'2018': { 'build': 12,
		'c': 134,
		'lsp': 2,
		'markup': 2,
		'other': 133,
		'py': 182},
	'2019': { 'build': 13,
		'c': 30,
		'doc': 8,
		'html': 10,
		'js': 1,
		'lsp': 2,
		'markup': 16,
		'other': 67,
		'py': 134}}
	pfactors for obj language
		2015--2016 pfactor == 0.9711606775110577  no change
	pfactors for doc language
		2015--2016 pfactor == 0.6669499228133753  no change
		2016--2017 pfactor == 0.7027338745275937  no change
		2018--2019 pfactor == 0.0009971248193242038  rise/drop
	pfactors for markup language
		2015--2016 pfactor == 0.5104066960256399  no change
		2017--2018 pfactor == 0.5532258789014389  no change
		2018--2019 pfactor == 1.756929555308731e-05  rise/drop
	pfactors for py language
		2015--2016 pfactor == 1.0629725495084215e-07  rise/drop
		2016--2017 pfactor == 1.2847558344252341e-25  rise/drop
		2017--2018 pfactor == 0.7125543569718793  no change
		2018--2019 pfactor == 0.026914075872778477  no change
	pfactors for sh language
		2015--2016 pfactor == 0.9711606775110577  no change
	pfactors for other language
		2015--2016 pfactor == 1.7143130378377696e-06  rise/drop
		2016--2017 pfactor == 0.020874234589765908  no change
		2017--2018 pfactor == 0.008365948846657284  no change
		2018--2019 pfactor == 0.1813919210757513  no change
	pfactors for c language
		2016--2017 pfactor == 2.770649054044977e-16  rise/drop
		2017--2018 pfactor == 0.9002187643203734  no change
		2018--2019 pfactor == 1.1559110387953382e-08  rise/drop
	pfactors for lsp language
		2016--2017 pfactor == 0.7027338745275937  no change
		2017--2018 pfactor == 0.8855759560371912  no change
		2018--2019 pfactor == 0.9944669523033288  no change
	pfactors for build language
		2016--2017 pfactor == 4.431916568235125e-05  rise/drop
		2017--2018 pfactor == 5.8273175348446296e-05  rise/drop
		2018--2019 pfactor == 0.1955154860787908  no change
	pfactors for html language
		2018--2019 pfactor == 0.0001652525618661536  rise/drop
	pfactors for js language
		2018--2019 pfactor == 0.7989681687355706  no change
```

----------------------------------

Although it is currently not implemented, one could take this one step further and visually represent an author's language changes on a graph, which would be simpler to interpret than viewing a long list of p-values such as the one shown above.

### oscar.py vs. Perl scripts

When it comes to creating new relationship files (`.tch`/`.s` files), using Perl over Python for large data-reading is more time-saving overall. This situation occurred in the complex application we covered where we modified an existing Perl file to get the initial commit times of each file for each author, rather than using Python to accomplish this task.

Before making this decision, one of our team members decided to run a test between two programs, [a2ft.py](https://bitbucket.org/swsc/lookup/src/master/a2ft.py) and [a2ft.perl](https://bitbucket.org/swsc/lookup/src/master/a2ft.perl). These programs were run at the same time for a period of 10 minutes. Both programs had the same task of retrieving the earliest commit times for each file under each author from `a2cFullP{0-31}.s` files. The Python version calls the `Commit_info().time_author` and `Commit().changed_file_names` functions from `oscar.py`. The Perl version ties each of the 32 `c2fFullO.{0-31}.tch` (`Commit().changed_file_names`) and `c2taFullP.{0-31}.tch` (`Commit_info().time_author`) files into two different Perl hashes, `%c2f` and `%c2ta`. The speed difference between Perl and Python was quite surprising:

```
[dkennard@da3]/data/play/dkennard% ll a2ftFullP0TEST1.s
-rw-rw-r--. 1 dkennard dkennard 980606 Jul 22 11:56 a2ftFullP0TEST1.s
[dkennard@da3]/data/play/dkennard% ll a2ftFullPTEST2.0.tch
-rw-r--r--. 1 dkennard dkennard 663563424 Jul 22 11:56 a2ftFullPTEST2.0.tch
```

Within this 10 minute period, the Python version only wrote 980,606 bytes of data into the `TEST1` file shown above, whereas the Perl version wrote 663,563,424 bytes into the `TEST2` file.

The main reason `oscar.py` is slower, in theory, is because `oscar.py` has more private function calls that it has to perform in order to calculate the key (`0-31`) and locate where the requested information is stored. Upon further inspection of the [oscar.py](https://github.com/ssc-oscar/oscar.py/blob/master/oscar.py) functions that are called, we can see that there are between 6 and 7 function calls for each lookup. All of these function calls cause function overhead and thus increase the amount of time to retrieve data for multiple entities.

In the Perl version of `a2ft`, the program simply calls `segB()`, which calculates the key of where the information is stored. The function takes a string and the number 32 as arguments (for example `segB(commit_sha, 32)`):

```
sub segB {
	my ($s, $n) = @_;
	return (unpack "C", substr ($s, 0, 1))%$n;
}
```

Because the `%c2f` and `%c2ta` Perl hashes are tied to their respective `.tch` files, we can then check if a specific commit in a specific number section is defined:

```
for my $c (@cs){	# where cs is a list of commits for an author and c is one of those commits
	my $sec =  segB ($c, $sections);
	if (defined $c2f{$sec}{$c} and defined $c2ta{$sec}{$c}){
		...
	}
	...
}
```

This is not to say that `oscar.py` is inefficient and should not be utilized, but it is not the optimal solution for creating new `.tch` or `.s` relationship files. `oscar.py` solely provides a Python interface for gathering requested data out of the respective `.tch` files and not for mass-reading all 32 files. It also provides simple function calls for retrieving bits of information at a time in a more convenient way.
