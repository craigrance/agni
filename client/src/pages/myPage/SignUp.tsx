import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import React, { useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    },
    paper: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0 auto',
      [theme.breakpoints.only('sm')]: { marginTop: 24 },
      width: '48%',
      minWidth: 276,
      maxWidth: 360,
      height: '48%',
      minHeight: 204,
      maxHeight: 360,
      padding: theme.spacing(3, 2)
    },
    textField: {
      width: '88%',
      minWidth: 240
    }
  })
);
const SignUp = () => {
  const classes = useStyles();

  const location = useLocation();
  useEffect(() => {
    console.log('wqwq');
    Array.from(document.getElementsByTagName('input')).forEach(inputElement =>
      inputElement.setAttribute('spellcheck', 'false')
    );
  }, [location]);

  return (
    <Box className={classes.root}>
      <Paper className={classes.paper}>
        <TextField
          id='standard-name'
          label='Name'
          className={classes.textField}
          // value={values.name}
          // onChange={handleChange('name')}
          margin='normal'
          placeholder='placeholder'
          variant='outlined'
        />
      </Paper>
    </Box>
  );
};

export default SignUp;
