I know you recomended that our code needed to be packaged in .py, .ipynb, .R But I have no knowladge of those technologies. Learning all the funtionalities for the opensource map (openlayers) I used took most of the development time. If I had to learn those technologies as well then I will need more time. I developed my solution in angular Because the city-hex-polygons-8-10.geojson and sr_hex.csv files are so large I could not add it to the GitHub repository. The programs load the data every time it is loaded. If you download the solution to build and run on your pc you need to copy those files to the assets folder under the SRC folder. To run the code on your computer you need to do the folowing:

Install Visual Studio Code
Install Node.js v14.20.0
Install angular/cli by running npm i @angular/cli@14.2.0 in comand prompt
Open the solution in Visual Studio Code
Pres Ctrl+` to open a Terminal
Delete node_modules folder and package-lock.json file.
Run 'npm install' in the terminal. 7 Run 'ng serve' a url will show where you can open the solution on normaly https://locahost:4200