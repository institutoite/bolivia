<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/mapa', function () {
    return view('mapa');
});

Route::get('/mapa-politico', function () {
    return view('mapa_politico');
});

Route::get('/mapa-bo-json', function () {
    return view('mapa_bo');
});

Route::get('/geodatos', function () {
    $base = public_path('geo/geodatos-master');
    $files = [];
    if (File::isDirectory($base)) {
        foreach (File::allFiles($base) as $f) {
            $ext = strtolower($f->getExtension());
            if (!in_array($ext, ['geojson','json'])) continue; // ignorar topojson, zip, csv, etc.
            $abs = $f->getRealPath();
            // ruta relativa respecto a public/
            $rel = str_replace(public_path() . DIRECTORY_SEPARATOR, '', $abs);
            // grupo: subcarpeta después de geodatos-master
            $group = trim(str_replace($base, '', $f->getPath()), DIRECTORY_SEPARATOR);
            $group = $group === '' ? 'raiz' : $group; // carpeta raíz de geodatos-master
            $files[] = [
                'name' => $f->getFilename(),
                'url' => asset(str_replace('\\','/',$rel)),
                'group' => str_replace('\\','/',$group),
                'path' => str_replace('\\','/',$rel),
            ];
        }
    }
    // ordenar por grupo y nombre
    usort($files, function($a,$b){
        return [$a['group'],$a['name']] <=> [$b['group'],$b['name']];
    });
    return view('geodatos_browser', ['files' => $files]);
});
