<?php

class UserDataBase {
    var $path;
    const All = 0;
    const FileOnly = 1;
    const DirOnly = 2;

    function __construct(string $path) {
        if ($path) {
            $this->path = substr($path, -1) === '/' ? $path : $path.'/';
        } else {
            $path = '';
        }
    }

    function addUser(string $name, string $pwd) {
        $users = $this->getUsersArray();

        foreach ($users as $user) {
            if ($user['name'] === $name) {
                throw new Error('User exists.');
            }
        }

        $id = 0;
        if (count($users)) {
            $id = $users[count($users) - 1]['id'] + 1;
        }

        mkdir($this->path.$id);

        array_push($users, array(
            'name' => $name,
            'pwd'  => $pwd,
            'id'   => $id
        ));

        $this->setUsersArray($users);
    }

    function setUserName(string $name, string $pwd, string $newName) {
        if ($name === $newName) return;
        $users = $this->getUsersArray();

        $p = -1;
        for ($i = 0; $i < count($users); ++$i) {
            if ($users[$i]['name'] === $newName) {
                throw new Error('Username exists.');
            }
            if ($users[$i]['name'] === $name) {
                $p = $i;
            }
        }

        if ($p === -1) {
            throw new Error('User not exists.');
        } else {
            if ($users[$p]['pwd'] !== $pwd) {
                throw new Error('Wrong password.');
            }
            $users[$p]['name'] = $newName;
        }

        $this->setUsersArray($users);
    }
    
    function setUserPwd(string $name, string $pwd, string $newPwd) {
        if ($name === $newPwd) return;
        $users = $this->getUsersArray();

        $p = -1;
        for ($i = 0; $i < count($users); ++$i) {
            if ($users[$i]['name'] === $name) {
                $p = $i;
            }
        }

        if ($p === -1) {
            throw new Error('User not exists.');
        } else {
            if ($users[$p]['pwd'] !== $pwd) {
                throw new Error('Wrong password.');
            }
            $users[$p]['pwd'] = $newPwd;
        }

        $this->setUsersArray($users);
    }

    function delUser(string $name, string $pwd) {
        $users = $this->getUsersArray();

        $found = false;
        for ($i = 0; $i < count($users); ++$i) {
            if ($users[$i]['name'] === $name) {
                if ($users[$i]['pwd'] !== $pwd) {
                    throw new Error('Wrong password.');
                }
                $found = true;
                $this->exec('rm -r '.$this->path.$users[$i]['id']);
                array_splice($users, $i, 1);
                break;
            }
        }

        if (!$found) {
            throw new Error('User not exists.');
        }

        $this->setUsersArray($users);
    }

    function mv(string $name, string $pwd, array $entries, string $dest) {
        $home = $this->getUserHome($name, $pwd);

        if (count($entries) === 0) {
            throw new Error('Empty entry list.');
        }

        $cmd = 'mv';
        foreach ($entries as $entry) {
            $this->assertNoDotDot($entry);
            $cmd .= ' '.$home.$entry;
        }
        $this->assertNoDotDot($dest);
        $cmd .= ' '.$home.$dest;

        $this->exec($cmd);
    }

    function rm(string $name, string $pwd, array $entries) {
        $home = $this->getUserHome($name, $pwd);

        if (count($entries) === 0) {
            throw new Error('Empty entry list.');
        }

        $cmd = 'rm -r';
        foreach ($entries as $entry) {
            $this->assertNoDotDot($entry);
            $cmd .= ' '.$home.$entry;
        }

        $this->exec($cmd);
    }

    function ls(string $name, string $pwd, array $entries, int $filter = UserDataBase::All, bool $recursive = false) {
        $home = $this->getUserHome($name, $pwd);
        
        $list = array();
        foreach ($entries as $entry) {
            $this->assertNoDotDot($entry);
            if (is_dir($home.$entry)) {
                $children = scandir($home.$entry);
                foreach ($children as $child) {
                    if ($child !== '.' && $child !== '..') {
                        $childPath = $entry === '' ? $child : $entry.'/'.$child;
                        $this->lsEntry($home, $childPath, $list, $filter, $recursive);
                    }
                }
            } else {
                $this->lsEntry($home, $entry, $list, $filter, $recursive);
            }
        }

        return $list;
    }

    function mkdir(string $name, string $pwd, array $dirArr) {
        $home = $this->getUserHome($name, $pwd);

        $cmd = 'mkdir';
        foreach ($dirArr as $dir) {
            $this->assertNoDotDot($dir);
            $cmd .= ' '.$home.$dir;
        }

        $this->exec($cmd);
    }

    function touch(string $name, string $pwd, array $fileArr) {
        $home = $this->getUserHome($name, $pwd);

        $cmd = 'touch';
        foreach ($fileArr as $file) {
            $this->assertNoDotDot($file);
            $cmd .= ' '.$home.$file;
        }

        $this->exec($cmd);
    }

    function getText(string $name, string $pwd, string $file) {
        $home = $this->getUserHome($name, $pwd);
        $this->assertNoDotDot($file);
        return $this->fileRead($home.$file);
    }

    function setText(string $name, string $pwd, string $file, string $text) {
        $home = $this->getUserHome($name, $pwd);
        $this->assertNoDotDot($file);
        return $this->fileWrite($home.$file, $text);
    }

    function getFiles(string $name, string $pwd, array $entries) {
        $home = $this->getUserHome($name, $pwd);

        $list = array();
        foreach ($entries as $entry) {
            $this->lsEntry($home, $entry, $list, UserDataBase::FileOnly, true);
        }

        $ret = array();
        foreach ($list as $file) {
            array_push($ret, $home.$file['name']);
        }

        return $ret;
    }

    function setFiles(string $name, string $pwd, array $files, array $dests, bool $delSource = false) {
        $home = $this->getUserHome($name, $pwd);
        
        if (count($files) !== count($dests)) {
            throw new Error('File number mismatches with destination number.');
        }

        for ($i = 0; $i < count($files); ++$i) {
            if (!is_file($files[$i])) {
                throw new Error('Invalid file.');
            }
            if ($delSource) {
                if (!rename($files[$i], $home.$dests[$i])) {
                    throw new Error('Fail to copy file.');
                }
            } else {
                if (!copy($files[$i], $home.$dests[$i])) {
                    throw new Error('Fail to move file.');
                }
            }
        }
    }

    private function fileRead(string $path) {
        $cont = file_get_contents($path);
        if ($cont === false) {
            throw new Error('Fail to read data.');
        } else {
            return $cont;
        }
    }

    private function fileWrite(string $path, string $cont) {
        if (file_put_contents($path, $cont) === false) {
            throw new Error('Fail to write data.');
        }
    }

    private function getUsersArray() {
        $json = $this->fileRead($this->path.'users');
        $arr = json_decode($json, true);
        if ($arr === false || $arr === null) {
            throw new Error('Invalid data format.');
        }
        return $arr;
    }

    private function setUsersArray(array $arr) {
        $this->fileWrite($this->path.'users', json_encode($arr));
    }

    private function getUserHome(string $name, string $pwd) {
        $users = $this->getUsersArray();

        foreach ($users as $user) {
            if ($user['name'] === $name) {
                if ($user['pwd'] !== $pwd) {
                    throw new Error('Wrong password.');
                }
                return $this->path.$user['id'].'/';
            }
        }

        throw new Error('User not exists.');
    }

    private function exec(string $cmd) {
        exec($cmd, $output);
        if (count($output)) {
            throw new Error($output[0]);
        }
    }

    private function assertNoDotDot(string $path) {
        if (strrpos($path, '..') !== false) {
            throw new Error('Path includes "..".');
        }
    }

    private function getEntryType(string $path) {
        if (is_file($path)) {
            return 'file';
        } else if (is_dir($path)) {
            return 'dir';
        } else {
            return false;
        }
    }

    /**
     * @param string $dir a dir path ended with '/'
     * @param string $entry an entry in $dir, without pending '/'
     */
    private function lsEntry(string $dir, string $entry, array &$list, int $filter, bool $recursive, int $father = -1) {
        // check for uniqueness
        foreach ($list as &$item) {
            if ($item['name'] === $entry) {
                return;
            }
        }

        $entryType = $this->getEntryType($dir.$entry);
        
        if ($entryType === 'file') {
            if ($filter === UserDataBase::All || $filter === UserDataBase::FileOnly) {
                $info = array(
                    'name'   => $entry,
                    'type'   => 'file',
                    'father' => $father,
                    'size'   => filesize($dir.$entry),
                    'mtime'  => filemtime($dir.$entry)
                );
                array_push($list, $info);
            }
        } else if ($entryType === 'dir') {
            $id = -1;
            if ($filter === UserDataBase::All || $filter === UserDataBase::DirOnly) {
                $info = array(
                    'name'   => $entry,
                    'type'   => 'dir',
                    'father' => $father
                );
                array_push($list, $info);
                $id = count($list) - 1;
            }
            
            if ($recursive) {
                $children = scandir($dir.$entry);
                foreach ($children as $child) {
                    if ($child !== '.' && $child !== '..') {
                        $childPath = $entry === '' ? $child : $entry.'/'.$child;
                        $this->lsEntry($dir, $childPath, $list, $filter, $recursive, $id);
                    }
                }
            }
        } else {
            throw new Error('Entry not exists.');
        }
    }
}