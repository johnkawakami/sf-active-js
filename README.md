sf-active-js
============

Javascript-centered front-end for the LA fork of sf-active.

This isn't really "released" or even alpha.  It's more of a sketchpad to work on this.

To use these scripts, you need sf-active to dump articles to .json files.  I don't have a diff, but here's the section
article_class.inc where the json file is dumped.  It's pretty straightforward, except that you'll have to alter the
str_replace part to match  your site.  To find this, search for the first couple lines or non-json parts.  The json
stuff is interspersed.

        $filedata .= $this->html_footer;
        $filedata_comments .= $this->html_comments;
        $filedata_comments .= $this->html_footer;

        $filedata_json = json_encode(array(
                                "article"=>$this->article,
                                "attachments"=>$this->attachments,
                                "comments"=>$this->comments));
        // really ugly hack to fix paths -johnk
        $filedata_json = str_replace( "\/usr\/local\/sf-active\/la.indymedia.org\/public\/",
                                      "http:\/\/la.indymedia.org\/\/", $filedata_json );

        // Now we cache the article
        if (!is_dir(SF_NEWS_PATH . "/" . $this->article['created_year']))
        {
            mkdir(SF_NEWS_PATH . "/" . $this->article['created_year'],0777);
            chmod(SF_NEWS_PATH . "/" . $this->article['created_year'],0777);
        }

        if (!is_dir($this->article['articlepath']))
        {
            mkdir($this->article['articlepath'], 0777);
        }

        $article_filename = $this->article['articlepath'] . $this->article['id'] . ".php";
        $comment_filename = $this->article['articlepath'] . $this->article['id'] . "_comment.php";
        $json_filename = $this->article['articlepath'] . $this->article['id'] . ".json";
        # echo "$article_filename <p>";

        $this->cache_file($filedata, $article_filename);
        $this->cache_file($filedata_comments, $comment_filename);
        $this->cache_file($filedata_json, $json_filename);


After this is done, you can regenerate the articles, and json files will be written alongside the php files in /news.

The js frontend then uses these json files as source material for each article.

To use js, check this out, and then move the js folder into the sf-active site's docroot.
