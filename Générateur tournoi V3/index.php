$url = "https://www.badnet.org/Src/";      
$content = file_get_contents($url);
$nfile = fopen("ajax-cross-get.txt", "w");
if($nfile != false)
{
   fwrite($nfile, $content);
   fclose($nfile);
}